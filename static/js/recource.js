// 资源管理相关的JavaScript代码
document.addEventListener('DOMContentLoaded', function() {
    // 资源选择器change事件
    const resourceSelector = document.getElementById('resource-selector');
    if (resourceSelector) {
        resourceSelector.addEventListener('change', function() {
            const resourceId = this.value;
            if (resourceId) {
                fetchResourceData(resourceId);
            }
        });

        // 初始化时加载第一个资源
        if (resourceSelector.options.length > 0) {
            const firstResourceId = resourceSelector.options[0].value;
            fetchResourceData(firstResourceId);
        }
    }

    // 资源数量修改按钮点击事件
    const changeResourceBtn = document.getElementById('change-resource-btn');
    if (changeResourceBtn) {
        changeResourceBtn.addEventListener('click', function() {
            showResourceChangeDialog();
        });
    }
});

// 获取资源数据
function fetchResourceData(resourceId) {
    showLoading();
    
    fetch(`/api/resources/${resourceId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('获取资源信息失败');
            }
            return response.json();
        })
        .then(data => {
            displayResourceInfo(data);
            hideLoading();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('获取资源信息时出错: ' + error.message);
            hideLoading();
        });
}

// 显示资源信息
function displayResourceInfo(resource) {
    // 填充资源信息到表单
    document.getElementById('resource-id').value = resource.资源编号 || '';
    document.getElementById('resource-name').value = resource.资源名称 || '';
    document.getElementById('resource-category').value = resource.资源分类 || '';
    document.getElementById('resource-quantity').value = resource.资源数量 || '';
    document.getElementById('start-date').value = resource.开始日期 || '';
    document.getElementById('end-date').value = resource.结束日期 || '';
    document.getElementById('start-time').value = resource.开始时间 || '';
    document.getElementById('end-time').value = resource.结束时间 || '';
    document.getElementById('priority').value = resource.优先级 || '';

    // 加载资源图片
    loadResourceImages(resource.资源名称);
}

// 加载资源图片
function loadResourceImages(resourceName) {
    const imageContainer = document.getElementById('resource-images');
    imageContainer.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">加载中...</span></div>';
    
    fetch(`/api/resource-images?name=${encodeURIComponent(resourceName)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('获取资源图片失败');
            }
            return response.json();
        })
        .then(data => {
            imageContainer.innerHTML = '';
            if (data.images && data.images.length > 0) {
                data.images.forEach(imageUrl => {
                    const imgContainer = document.createElement('div');
                    imgContainer.className = 'resource-image-container';
                    
                    const img = document.createElement('img');
                    img.src = imageUrl;
                    img.className = 'resource-image';
                    img.alt = resourceName;
                    
                    imgContainer.appendChild(img);
                    imageContainer.appendChild(imgContainer);
                });
            } else {
                imageContainer.innerHTML = '<p class="text-muted">无可用图片</p>';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            imageContainer.innerHTML = '<p class="text-danger">加载图片失败</p>';
        });
}

// 显示资源变更对话框
function showResourceChangeDialog() {
    // 创建对话框元素
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'resourceChangeModal';
    modal.tabIndex = '-1';
    modal.setAttribute('aria-labelledby', 'resourceChangeModalLabel');
    modal.setAttribute('aria-hidden', 'true');
    
    const resourceName = document.getElementById('resource-name').value;
    const currentQuantity = document.getElementById('resource-quantity').value;
    
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="resourceChangeModalLabel">资源变更</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="resource-change-form">
                        <div class="mb-3">
                            <label for="modal-resource-name" class="form-label">资源名称</label>
                            <input type="text" class="form-control" id="modal-resource-name" value="${resourceName}" readonly>
                        </div>
                        <div class="mb-3">
                            <label for="modal-resource-quantity" class="form-label">资源数量</label>
                            <input type="number" class="form-control" id="modal-resource-quantity" value="${currentQuantity}" min="0" step="1" required>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                    <button type="button" class="btn btn-primary" id="confirm-resource-change">确定</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 显示对话框
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
    
    // 确认按钮点击事件
    document.getElementById('confirm-resource-change').addEventListener('click', function() {
        const quantityInput = document.getElementById('modal-resource-quantity');
        const newQuantity = quantityInput.value;
        
        if (!newQuantity || isNaN(newQuantity) || newQuantity < 0) {
            alert('请输入有效的资源数量');
            return;
        }
        
        // 发送资源变更请求
        changeResourceQuantity(resourceName, newQuantity);
        
        // 关闭对话框
        modalInstance.hide();
        
        // 移除对话框元素
        modal.addEventListener('hidden.bs.modal', function() {
            document.body.removeChild(modal);
        });
    });
}

// 变更资源数量
function changeResourceQuantity(resourceName, quantity) {
    showLoading();
    
    fetch('/api/change-resource', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            '资源名称': resourceName,
            '资源数量': quantity
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('资源变更请求失败');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            alert('资源数量更新成功！');
            // 更新显示的资源数量
            document.getElementById('resource-quantity').value = quantity;
            
            // 重新运行算法
            runAlgorithm();
        } else {
            alert(data.message || '资源变更失败');
        }
        hideLoading();
    })
    .catch(error => {
        console.error('Error:', error);
        alert('资源变更过程中出错: ' + error.message);
        hideLoading();
    });
}

// 运行算法
function runAlgorithm() {
    showLoading();
    
    fetch('/api/run-algorithm', {
        method: 'POST',
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('算法运行请求失败');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            alert('排程算法运行成功！');
            // 如果甘特图已打开，则刷新显示
            if (document.getElementById('gantt-page') && 
                document.getElementById('gantt-page').style.display !== 'none' &&
                typeof drawGanttChart === 'function') {
                drawGanttChart();
            }
        } else {
            alert(data.message || '算法运行失败');
        }
        hideLoading();
    })
    .catch(error => {
        console.error('Error:', error);
        alert('算法运行过程中出错: ' + error.message);
        hideLoading();
    });
}

// 工单锁排程对话框
function showLockSchedulingDialog() {
    // 创建对话框元素
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'lockSchedulingModal';
    modal.tabIndex = '-1';
    modal.setAttribute('aria-labelledby', 'lockSchedulingModalLabel');
    modal.setAttribute('aria-hidden', 'true');
    
    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="lockSchedulingModalLabel">锁排程信息输入</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="lock-scheduling-form">
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <label for="work-order-number" class="form-label">工单编号</label>
                                <input type="text" class="form-control" id="work-order-number" required>
                            </div>
                            <div class="col-md-6">
                                <label for="material-number" class="form-label">物料编号</label>
                                <input type="text" class="form-control" id="material-number" required>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label for="procedure" class="form-label">工序</label>
                            <input type="text" class="form-control" id="procedure" required>
                        </div>
                        <div class="mb-3">
                            <label for="resource-pool" class="form-label">资源池（多个资源用逗号分隔）</label>
                            <input type="text" class="form-control" id="resource-pool" required>
                        </div>
                        <div class="mb-3">
                            <label for="resource-id-input" class="form-label">资源ID（多个ID用逗号分隔）</label>
                            <input type="text" class="form-control" id="resource-id-input" required>
                        </div>
                        <div class="mb-3">
                            <label for="resource-demand" class="form-label">资源需求（多个需求用逗号分隔）</label>
                            <input type="text" class="form-control" id="resource-demand" required>
                        </div>
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <label for="start-time-input" class="form-label">开始时间（YYYY-MM-DD HH:MM）</label>
                                <input type="text" class="form-control" id="start-time-input" required>
                            </div>
                            <div class="col-md-6">
                                <label for="end-time-input" class="form-label">结束时间（YYYY-MM-DD HH:MM）</label>
                                <input type="text" class="form-control" id="end-time-input" required>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                    <button type="button" class="btn btn-primary" id="confirm-lock-scheduling">确定</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 显示对话框
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
    
    // 确认按钮点击事件
    document.getElementById('confirm-lock-scheduling').addEventListener('click', function() {
        // 获取表单数据
        const workOrder = document.getElementById('work-order-number').value;
        const material = document.getElementById('material-number').value;
        const procedure = document.getElementById('procedure').value;
        const resourcePool = document.getElementById('resource-pool').value.split(',');
        const resourceId = document.getElementById('resource-id-input').value.split(',');
        const resourceDemand = document.getElementById('resource-demand').value.split(',').map(Number);
        const startTime = document.getElementById('start-time-input').value;
        const endTime = document.getElementById('end-time-input').value;
        
        // 检查必填字段
        if (!workOrder || !material || !procedure || !resourcePool || !resourceId || !resourceDemand || !startTime || !endTime) {
            alert('请填写所有必填字段');
            return;
        }
        
        // 构造锁排程数据
        const lockSchedulingData = {
            [workOrder]: {
                [material]: {
                    "工序": procedure,
                    "资源池": [resourcePool],
                    "资源ID": [resourceId],
                    "资源需求": [resourceDemand],
                    "开始时间": [[startTime]],
                    "结束时间": [[endTime]]
                }
            }
        };
        
        // 发送锁排程请求
        lockScheduling(lockSchedulingData);
        
        // 关闭对话框
        modalInstance.hide();
        
        // 移除对话框元素
        modal.addEventListener('hidden.bs.modal', function() {
            document.body.removeChild(modal);
        });
    });
}

// 执行锁排程
function lockScheduling(lockSchedulingData) {
    showLoading();
    
    fetch('/api/lock-scheduling', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(lockSchedulingData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('锁排程请求失败');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            alert('锁排程操作成功！');
            // 重新运行算法
            runAlgorithm();
        } else {
            alert(data.message || '锁排程失败');
        }
        hideLoading();
    })
    .catch(error => {
        console.error('Error:', error);
        alert('锁排程过程中出错: ' + error.message);
        hideLoading();
    });
}

// 添加工单对话框
function showAddWorkOrderDialog() {
    // 创建对话框元素
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'addWorkOrderModal';
    modal.tabIndex = '-1';
    modal.setAttribute('aria-labelledby', 'addWorkOrderModalLabel');
    modal.setAttribute('aria-hidden', 'true');
    
    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="addWorkOrderModalLabel">插入一个工单</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="add-work-order-form">
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <label for="work-order-number-input" class="form-label">工单编号</label>
                                <input type="text" class="form-control" id="work-order-number-input" required>
                            </div>
                            <div class="col-md-6">
                                <label for="material-number-input" class="form-label">物料编号</label>
                                <input type="text" class="form-control" id="material-number-input" required>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label for="quantity-input" class="form-label">数量</label>
                            <input type="number" class="form-control" id="quantity-input" required min="1">
                        </div>
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <label for="start-time-plan" class="form-label">计划开始时间（%Y%m%d%H%M）</label>
                                <input type="text" class="form-control" id="start-time-plan" required>
                            </div>
                            <div class="col-md-6">
                                <label for="end-time-plan" class="form-label">计划完工时间（%Y%m%d%H%M）</label>
                                <input type="text" class="form-control" id="end-time-plan" required>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label for="predecessor-work-order" class="form-label">前置工单（可为空）</label>
                            <input type="text" class="form-control" id="predecessor-work-order">
                        </div>
                        <div class="mb-3">
                            <label for="scheduling-strategy" class="form-label">排程策略</label>
                            <input type="text" class="form-control" id="scheduling-strategy" value="正排" required>
                        </div>
                        <div class="mb-3">
                            <label for="procedure-input" class="form-label">工序</label>
                            <input type="text" class="form-control" id="procedure-input" required>
                        </div>
                        <div class="mb-3">
                            <label for="predecessor-procedure" class="form-label">前置工序</label>
                            <input type="text" class="form-control" id="predecessor-procedure" required>
                        </div>
                        <div class="mb-3">
                            <label for="resource-name-requirement" class="form-label">资源名称/资源需求</label>
                            <input type="text" class="form-control" id="resource-name-requirement" required>
                        </div>
                        <div class="row mb-3">
                            <div class="col-md-4">
                                <label for="preparation-hours" class="form-label">准备工时</label>
                                <input type="number" class="form-control" id="preparation-hours" required min="0" step="0.1">
                            </div>
                            <div class="col-md-4">
                                <label for="operation-hours" class="form-label">作业工时</label>
                                <input type="number" class="form-control" id="operation-hours" required min="0" step="0.1">
                            </div>
                            <div class="col-md-4">
                                <label for="post-hours" class="form-label">后置工时</label>
                                <input type="number" class="form-control" id="post-hours" required min="0" step="0.1">
                            </div>
                        </div>
                        <div class="mb-3">
                            <label for="is-locked" class="form-label">是否锁排程</label>
                            <select class="form-select" id="is-locked" required>
                                <option value="false" selected>False</option>
                                <option value="true">True</option>
                            </select>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                    <button type="button" class="btn btn-primary" id="confirm-add-work-order">确定</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 显示对话框
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
    
    // 确认按钮点击事件
    document.getElementById('confirm-add-work-order').addEventListener('click', function() {
        // 获取表单数据
        const workOrderInfo = {
            "工单编号": document.getElementById('work-order-number-input').value,
            "物料编号": document.getElementById('material-number-input').value,
            "数量": document.getElementById('quantity-input').value,
            "计划开始时间": document.getElementById('start-time-plan').value,
            "计划结束时间": document.getElementById('end-time-plan').value,
            "前置工单": document.getElementById('predecessor-work-order').value,
            "排程策略": document.getElementById('scheduling-strategy').value,
            "工序": document.getElementById('procedure-input').value,
            "前置工序": document.getElementById('predecessor-procedure').value,
            "资源名称/资源需求": document.getElementById('resource-name-requirement').value,
            "准备工时": document.getElementById('preparation-hours').value,
            "作业工时": document.getElementById('operation-hours').value,
            "后置工时": document.getElementById('post-hours').value,
            "是否锁排程": document.getElementById('is-locked').value === "true"
        };
        
        // 检查必填字段
        for (const key in workOrderInfo) {
            if (key !== "前置工单" && key !== "是否锁排程" && !workOrderInfo[key]) {
                alert('请填写所有必填字段');
                return;
            }
        }
        
        // 发送添加工单请求
        addWorkOrder(workOrderInfo);
        
        // 关闭对话框
        modalInstance.hide();
        
        // 移除对话框元素
        modal.addEventListener('hidden.bs.modal', function() {
            document.body.removeChild(modal);
        });
    });
}

// 添加工单
function addWorkOrder(workOrderInfo) {
    showLoading();
    
    fetch('/api/add-work-order', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(workOrderInfo)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('添加工单请求失败');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            alert('工单添加成功！');
            // 重新运行算法
            runAlgorithm();
        } else {
            alert(data.message || '添加工单失败');
        }
        hideLoading();
    })
    .catch(error => {
        console.error('Error:', error);
        alert('添加工单过程中出错: ' + error.message);
        hideLoading();
    });
}