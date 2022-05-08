// 사용
var isDivideVideo = false;

// 미확인
var nowImage;
let openkey;
let savelabel;
let tmpcanvas, tmpframe;

var radius = 5;
var dragging = false;

let currentId = 1; // Current Canvas ID

// 4. 영상 이미지 분리를 위한 재생 함수
async function getVideoTrack() {
    var video = document.getElementById("video");
    video.crossOrigin = "anonymous";
    document.body.append(video);

    const videourl = URL.createObjectURL(file);
    video.src = videourl;

    await video.play();
    const [track] = video.captureStream().getVideoTracks();
    video.onended = (evt) => track.stop();
    return track;
} 

// 1. 사용자 업로드 영상 불러오기 (ex. demo_cat.mp4 -> 각 frame-idx)
const elImage = document.querySelector("#upload_video");
elImage.addEventListener("change", (evt) => {
    const file = evt.target.files[0];
    
    // 1) Information 정보 추가 
    const fileName = document.querySelector("#file_name");
    fileName.textContent = file['name'];

    const fileSize = document.querySelector("#file_size");
    fileSize.textContent = file['size'] + " byte";

    const fileType = document.querySelector("#file_type");
    fileType.textContent = file['type'];


    // 2) 비디오 화면에 추가하기
    //   - 인자로 File객체를 받으며, 해당 file의 고유 URL 정보 생성하고 반환
    document.getElementById("step1").style.display = 'none';
    document.getElementById("step2").style.display = 'block';

    // 3) 영상 분리하기
    const frames = [];
    const select = document.querySelector("select");
    // const canvas = document.getElementById("imgViewer");
    // const ctx = canvas.getContext("2d");
    // tmpcanvas = canvas;

    // 4) Canvas 생성

    // 4) 분할 Icon 클릭시
    const button = document.getElementById("divide_video");
    button.onclick = async (evt) => {
        if (window.MediaStreamTrackProcessor) {
            isDivideVideo = true;
            let stopped = false;
            const track = await getVideoTrack();

            const processor = new MediaStreamTrackProcessor(track);
            const reader = processor.readable.getReader();
            readChunk();

            // (2) 각각 이미지들 Tag로 만들기
            function readChunk() {
                reader.read().then(async ({ done, value }) => {
                    if (value) {
                        const bitmap = await createImageBitmap(value);
                        const index = frames.length;
                        frames.push(bitmap);

                        //  - 이미지 리스트 내 ID 값, 실제 해당하는 이미지
                        select.append(new Option("Frame #" + (index + 1), index));

                        const imageListUl = document.getElementById("image-list");
                        const imageItem = document.createElement("li");
                        imageItem.setAttribute("id", "frame-" + (index + 1));
                        imageItem.setAttribute("class", "image-item");
                        imageItem.onclick = image_click;

                        const imageCanvas = document.createElement("canvas");
                        imageCanvas.width = 120;
                        imageCanvas.height = 100;

                        const imageId = document.createElement("p");
                        imageId.textContent = "frame-" + (index + 1);
                        var imgjson = new Object();
                        imgjson.points = [];
                        imgjson.dot = 0;
                        savejson[`${imageId.textContent}`] = imgjson;

                        const imageCtx = imageCanvas.getContext("2d");
                        imageCtx.drawImage(bitmap, 0, 0, 120, 100);

                        // - Information bar - Total Frame의 값
                        const fileTotalFram = document.querySelector("#file_frame");
                        fileTotalFram.textContent = index + 1;

                        // - 사이드바 이미지 리스트
                        imageItem.append(imageCanvas);
                        imageItem.append(imageId);
                        imageListUl.append(imageItem);
                        
                        // CHNAAAM
                        // 1) li 태그 생성
                        const liTag = document.createElement('li');
                        liTag.className = "drawArea";
                        liTag.style.position = "absolute";
                        liTag.style.zIndex = 2;
                        liTag.style.display = "none";

                        // 2) 캠버스 생성 및 초기화 작업
                        const predefinedCanvas = document.createElement("canvas");
                        predefinedCanvas.setAttribute("id", "canvas-drawing-" + document.getElementById("drawAreaStack").childNodes.length);
                        const context = predefinedCanvas.getContext("2d");
                        
                        predefinedCanvas.width = bitmap.width;
                        predefinedCanvas.height = bitmap.height;
                        
                        /////////////////////////////////////////////////////
                        var putPoint = function (e) {
                            if (dragging) {
                                context.lineTo(e.offsetX, e.offsetY);
                                context.stroke();
                                context.beginPath();
                                context.arc(e.offsetX, e.offsetY, radius, 0, Math.PI * 2);
                                // context.arc(e.offsetX, e.offsetY, 1, 0, Math.PI * 2);
                                context.fill();
                                context.beginPath();
                                if (bErasing == true) {
                                    context.globalCompositeOperation = "destination-out";
                                } else {
                                    context.globalCompositeOperation = "source-over";
                                }
                                context.moveTo(e.offsetX, e.offsetY);
                            }
                        }

                        var engage = function (e) {
                            dragging = true;
                            putPoint(e);
                        }

                        var disengage = function () {
                            dragging = false;
                            context.beginPath();
                        }

                        predefinedCanvas.addEventListener('mousedown', engage);
                        predefinedCanvas.addEventListener('mouseup', disengage);
                        predefinedCanvas.addEventListener('mousemove', putPoint);
                        /////////////////////////////////////////////////////
                        context.strokeStyle = 'black';
                        context.lineWidth = '30';
                        context.lineCap = ctx.lineJoin = 'round';
                        console.log("helo")

                        // 3) li 태그들 -> ul 태그 넣기
                        liTag.appendChild(predefinedCanvas);
                        document.getElementById("drawAreaStack").appendChild(liTag);
                        value.close();

                    }
                    if (!done && !stopped) {
                        readChunk();
                    } else {
                        select.disabled = false;
                    }
                });
                button.onclick = (evt) => stopped = true;
            }
        } else {
            console.error("your browser doesn't support this API yet");
        }
    };


    // 5) Frame-idx 가 클릭 되었을 때
    function image_click() {
        ctx.beginPath();
        var firstX, firstY;
        var X, Y;
        var attribute = this.getAttribute('id')
        var tt = new Array(attribute);
        openkey = tt[0];

        if (nowImage != null) {
            nowImage.style.color = 'black';
            nowImage.style.fontWeight = 400;
        }

        // (1) 이미지 선택 되었을 때 frame-idx text bold 및 색 변경
        nowImage = document.getElementById(openkey);
        nowImage.style.color = '#708AE8';
        nowImage.style.fontWeight = 600;

        // (2) Information bar - Now Frame 값 (ex. Now Frame : frame-2)
        const fileNow = document.querySelector("#label_now");
        fileNow.textContent = openkey;
        console.log(nowImage);

        // (3) index -1  태그에 각 이미지 그리기 (ex. 고양이)
        const frame = frames[attribute.split('-')[1]];
        tmpframe = frame;
        canvas.width = frame.width;
        canvas.height = frame.height;
        ctx.drawImage(frame, 0, 0);


        // (4) 그림판 canvas 태그 관련
        // CHNAAAM
        bErasing = false;
        document.getElementById("canvas-drawing-" + currentId).parentNode.style.display = "none";
        document.getElementById("canvas-drawing-" + attribute.split('-')[1]).parentNode.style.display = "block";
        currentId = attribute.split('-')[1];

        var drawCtx = document.getElementById("canvas-drawing-" + attribute.split('-')[1]).getContext("2d");
        // drawCtx.fillRect(25 + attribute.split('-')[1] * 10, 25 + attribute.split('-')[1] * 10, 100 + attribute.split('-')[1] * 10, 100 + attribute.split('-')[1] * 10);
        // drawCtx.clearRect(45, 45, 60, 60);
        // drawCtx.strokeRect(50, 50, 50, 50);

        // drawCtx.beginPath();
        // drawCtx.rect(0, 0, canvas2.width, canvas2.height);
        // drawCtx.fillStyle = 'rgba(255, 0, 0, 0.2)';
        // drawCtx.fill();
        // drawCtx.beginPath();

        drawCtx.lineWidth = radius * 2;
        // drawCtx.lineWidth = 1 * 2;
        bErasing = false;

        currentId = attribute.split('-')[1];
    };

});

// var colors = ['black', 'pink', 'red', 'yellow', 'green', 'blue']; //Color array to select from
// /*Handles the creation of color*/
// for (var i = 0, n = colors.length; i < n; i++) {
//     var swatch = document.createElement('nav');
//     swatch.className = 'swatch';
//     swatch.style.backgroundColor = colors[i];
//     swatch.addEventListener('click', setSwatch);
//     document.getElementById('colors').appendChild(swatch);
// }

// /*set color*/
// function setColor(color) {
//     // const canvas = document.getElementById("canvas-drawing-" + currentId);
//     // var context = canvas.getContext("2d");

//     context.fillStyle = color;
//     context.strokeStyle = color;
//     var active = document.getElementsByClassName('active')[0];
//     if (active) {
//         active.className = 'swatch';
//     }
// }
// function setSwatch(e) {
//     bErasing = false;
//     //identify swatch
//     var swatch = e.target;
//     //set color
//     setColor(swatch.style.backgroundColor);
//     //give active class
//     swatch.className += ' active';
// }
// setSwatch({ target: document.getElementsByClassName('swatch')[0] }); //set default swatch

// var canvas = document.getElementById('drawArea');
// // var canvas = document.getElementById("canvas-drawing-1");
// var context = canvas.getContext('2d');
// var radius = 5;
// var dragging = false;
// var bErasing = false;

// context.beginPath();
// context.rect(0, 0, canvas.width, canvas.height);
// context.fillStyle = 'rgba(255, 0, 0, 0.2)';
// context.fill();
// context.beginPath();

// context.lineWidth = radius * 2;

// var putPoint = function (e) {
//     if (dragging) {
//         context.lineTo(e.offsetX, e.offsetY);
//         context.stroke();
//         context.beginPath();
//         context.arc(e.offsetX, e.offsetY, radius, 0, Math.PI * 2);
//         context.fill();
//         context.beginPath();
//         if (bErasing == true) {
//             context.globalCompositeOperation = "destination-out";
//         } else {
//             context.globalCompositeOperation = "source-over";
//         }
//         context.moveTo(e.offsetX, e.offsetY);
//         // context.lineTo(e.pageX ,e.pageY);
//         // context.stroke();
//         // context.lineTo(e.offsetX, e.offsetY);
//         // context.stroke();
//         // context.beginPath();
//         // context.arc(e.offsetX, e.offsetY, radius, 0, Math.PI*2);
//         // context.fill();
//         // context.beginPath();
//         // context.moveTo(e.offsetX, e.offsetY);
//     }
// }

// var engage = function (e) {
//     dragging = true;
//     putPoint(e);
// }

// var disengage = function () {
//     dragging = false;
//     context.beginPath();
// }

// canvas.addEventListener('mousedown', engage);
// canvas.addEventListener('mouseup', disengage);
// canvas.addEventListener('mousemove', putPoint);

// var setRadius = function (newRadius) {
//     if (newRadius < minRad) newRadius = minRad;
//     else if (newRadius > maxRad) newRadius = maxRad;
//     radius = newRadius;
//     context.lineWidth = radius * 2;

//     radSpan.innerHTML = radius;
// }

// var minRad = 1,
//     maxRad = 40,
//     defaultRad = 15,
//     interval = 5,
//     radSpan = document.getElementById('radval'),
//     decRad = document.getElementById('decrad'),
//     incRad = document.getElementById('incrad');

// decRad.addEventListener('click', function () {
//     setRadius(radius - interval);
// });
// incRad.addEventListener('click', function () {
//     setRadius(radius < interval ? interval : radius + interval);
// });

// setRadius(defaultRad);

// //////////////////////////////////////////////////////

// var colors = ['black', 'pink', 'red', 'yellow', 'green', 'blue']; //Color array to select from
// /*Handles the creation of color*/
// for (var i = 0, n = colors.length; i < n; i++) {
//     var swatch = document.createElement('nav');
//     swatch.className = 'swatch';
//     swatch.style.backgroundColor = colors[i];
//     swatch.addEventListener('click', setSwatch);
//     document.getElementById('colors').appendChild(swatch);
// }
// /*set color*/
// function setColor(color) {
//     context.fillStyle = color;
//     context.strokeStyle = color;
//     var active = document.getElementsByClassName('active')[0];
//     if (active) {
//         active.className = 'swatch';
//     }
// }
// function setSwatch(e) {
//     bErasing = false;
//     //identify swatch
//     var swatch = e.target;
//     //set color
//     setColor(swatch.style.backgroundColor);
//     //give active class
//     swatch.className += ' active';
// }
// setSwatch({ target: document.getElementsByClassName('swatch')[0] }); //set default swatch

// //////////////////////////////////////

// var button = document.getElementById('save');
// button.addEventListener('click', saveImage);

// function saveImage(el) {
//     console.log('download');
//     bErasing = true;
//     // const canvas = document.getElementById('drawArea');
//     var canvas = document.getElementById('drawArea');
//     const link = document.createElement('a');
//     link.download = 'download.png';
//     link.href = canvas.toDataURL();
//     link.click();
//     link.delete;
// };

// var buttonclear = document.getElementById('clear');
// buttonclear.addEventListener('click', clearImage);

// function clearImage() {
//     console.log("clear!!");
//     var currentFillStyle = context.fillStyle;
//     context.clearRect(0, 0, canvas.width, canvas.height);
//     context.rect(0, 0, canvas.width, canvas.height);
//     context.fillStyle = "rgba(255, 0, 0, 0%)";
//     context.fill();
//     context.beginPath();
//     context.fillStyle = currentFillStyle;
//     context.strokeStyle = currentFillStyle;
// };

// // var buttoneraser = document.getElementById('my-eraser');
// // buttoneraser.addEventListener('click', clearImage);

// function eraserImage() {
//     console.log('eraser');
//     bErasing = true;
// };





//***/***/***/***/***/***/***/***/***/***/***/***/***/***//
// 이외 기능
//***/***/***/***/***/***/***/***/***/***/***/***/***/***//
// 1. Object 이름 지정 모달 (ex.)
const modal = document.querySelector('.modal');
const btnOpenPopup = document.querySelector('.btn-open-popup');
btnOpenPopup.addEventListener(
    'click', () => {
        if (isDivideVideo) {
            alert("영상을 이미지로 분할하여 Object의 이름을 변경할 수 없습니다.")
            return;
        }
        modal.style.display = 'block';
    });

const closeBtn = modal.querySelector(".close-area")
closeBtn.addEventListener("click", e => {
    modal.style.display = "none"
})


// 1. Object 이름 정의 및 변경 함수 (ex. cat Label)
function define_tag() {
    const label = document.getElementById("label_tag").value;

    const fileName = document.querySelector("#label_name");
    fileName.textContent = label;
    savelabel = label;
    const modal = document.querySelector('.modal');
    modal.style.display = "none"
}

// 3. select tag 선택 될 때 화면 전환
select.onchange = (evt) => {
    const frame = frames[select.value];
    canvas.width = frame.width;
    canvas.height = frame.height;
    ctx.drawImage(frame, 0, 0);
};
