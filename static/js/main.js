// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 处理文件选择
    const fileInput = document.getElementById('formFile');
    const fileNameDisplay = document.getElementById('file-name-display');
    const uploadBtn = document.getElementById('upload-btn');
    const loadingSpinner = document.getElementById('loading-spinner');
    const uploadForm = document.getElementById('upload-form');

    if(fileInput) {
        fileInput.addEventListener('change', function() {
            if (this.files.length > 0) {
                fileNameDisplay.textContent = '已选择: ' + this.files[0].name;
                uploadBtn.classList.remove('d-none');
            } else {
                fileNameDisplay.textContent = '';
                uploadBtn.classList.add('d-none');
            }
        });
    }

    if(uploadForm) {
        uploadForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (!fileInput.files.length) {
                alert('请先选择Excel文件');
                return;
            }
            
            loadingSpinner.classList.remove('d-none');
            uploadBtn.disabled = true;
            
            // 创建FormData对象
            const formData = new FormData();
            formData.append('file', fileInput.files[0]);
            
            // 发送文件到服务器
            fetch('/upload', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                loadingSpinner.classList.add('d-none');
                uploadBtn.disabled = false;
                
                if (data.success) {
                    // 重定向到排程系统页面
                    window.location.href = '/scheduling';
                } else {
                    alert('处理失败: ' + data.error);
                }
            })
            .catch(error => {
                loadingSpinner.classList.add('d-none');
                uploadBtn.disabled = false;
                alert('发生错误: ' + error);
            });
        });
    }

    // 处理导航菜单点击事件
    document.querySelectorAll('.sidebar-menu li').forEach(item => {
        item.addEventListener('click', function() {
            // 移除所有激活状态
            document.querySelectorAll('.sidebar-menu li').forEach(li => {
                li.classList.remove('active');
            });
            
            // 添加当前激活状态
            this.classList.add('active');
            
            // 处理内容区域的变化
            const targetId = this.getAttribute('data-target');
            if (targetId) {
                document.querySelectorAll('.content-section').forEach(section => {
                    section.classList.add('d-none');
                });
                document.getElementById(targetId).classList.remove('d-none');
            }
        });
    });

    // 初始化菜单激活状态
    const activeMenuItem = document.querySelector('.sidebar-menu li[data-default="true"]');
    if (activeMenuItem) {
        activeMenuItem.click();
    }

    // 打开文件按钮点击事件
    const openFileBtn = document.getElementById('openFileBtn');
    if (openFileBtn) {
        openFileBtn.addEventListener('click', function() {
            if (fileInput) {
                fileInput.click();
            }
        });
    }
});