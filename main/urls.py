from django.urls import path
from django.conf.urls.static import static
from django.contrib.auth import views as auth_views
from django.conf import settings
from . import views

app_name='main'

urlpatterns = [
    path('', views.index, name='index'),
    path('home/', views.home, name='home'),
# 카카오 로그인
    # path('home/login/kakao/', views.kakao_login, name='kakao-login'),
    # path('home/login/kakao/callback/', views.kakao_login_callback, name='kakao-callback'),
# 회원가입, 로그인
    path('home/login/', auth_views.LoginView.as_view(template_name='login.html'), name='login'),
    path('home/logout/', views.logout, name='logout'),
    path('home/signup/', views.signup, name='signup'),
# 게시판
    path('board/', views.board, name='board'),
    path('<int:pk>/', views.detail, name='detail'),
    path('write/', views.write, name='write'),
    path('write/write_board', views.write_board, name='write_board'),
    path('<int:pk>/update', views.update, name='update'),
    path('<int:pk>/delete', views.delete, name='delete'),
# 댓글
    path('<int:pk>/create_reply', views.create_reply, name='create_reply'),
    path('<int:pk>/delete_reply', views.delete_reply, name='delete_reply'),
    
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)