class GanttChart {
    constructor(containerId, data) {
        this.container = document.getElementById(containerId);
        this.data = data;
        this.colors = [
            '#3498db', '#e74c3c', '#2ecc71', '#f1c40f',
            '#9b59b6', '#1abc9c', '#e67e22', '#34495e'
        ];
        this.tooltip = null;
        this.init();
    }

    init() {
        // 处理数据
        this.processData();
        
        // 创建甘特图
        this.createGanttChart();
        
        // 创建图例
        this.createLegend();
        
        // 创建数据表格
        this.createDataTable();
        
        // 初始化工具提示
        this.initTooltip();
    }

    processData() {
        // 按资源类型分组
        this.resourceGroups = {};
        
        this.data.forEach(item => {
            const resource = item.resourceType;
            if (!this.resourceGroups[resource]) {
                this.resourceGroups[resource] = [];
            }
            
            // 解析日期
            const startDate = new Date(item.startTime);
            const endDate = new Date(item.endTime);
            
            this.resourceGroups[resource].push({
                id: item.id,
                label: `${item.workOrderId} ${item.procedure}`,
                start: startDate,
                end: endDate,
                duration: (endDate - startDate) / (1000 * 60 * 60), // 小时
                resource: resource,
                workOrderId: item.workOrderId,
                procedure: item.procedure
            });
        });
        
        // 找到最早和最晚的日期
        let minDate = new Date();
        let maxDate = new Date(0);
        
        Object.values(this.resourceGroups).flat().forEach(task => {
            if (task.start < minDate) minDate = task.start;
            if (task.end > maxDate) maxDate = task.end;
        });
        
        // 设置日期范围
        this.startDate = new Date(minDate);
        this.startDate.setHours(0, 0, 0, 0);
        
        this.endDate = new Date(maxDate);
        this.endDate.setHours(23, 59, 59, 999);
        
        // 计算总天数
        const totalDays = Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24)) + 1;
        this.totalDays = totalDays;
    }

    createGanttChart() {
        // 创建甘特图容器
        const ganttContainer = document.createElement('div');
        ganttContainer.className = 'gantt-chart';
        
        // 创建时间线
        const timeline = this.createTimeline();
        ganttContainer.appendChild(timeline);
        
        // 创建每个资源组的行
        let resourceIndex = 0;
        for (const [resource, tasks] of Object.entries(this.resourceGroups)) {
            // 为每个资源创建组标题
            const resourceHeader = document.createElement('div');
            resourceHeader.className = 'gantt-row';
            resourceHeader.innerHTML = `
                <div class="gantt-row-header" style="font-weight: bold; color: #2c3e50;">
                    ${resource}
                </div>
                <div class="gantt-row-bars" style="background-color: #ecf0f1;"></div>
            `;
            ganttContainer.appendChild(resourceHeader);
            
            // 为每个任务创建行
            tasks.forEach((task, taskIndex) => {
                const row = document.createElement('div');
                row.className = 'gantt-row';
                
                const rowHeader = document.createElement('div');
                rowHeader.className = 'gantt-row-header';
                rowHeader.textContent = task.label;
                
                const rowBars = document.createElement('div');
                rowBars.className = 'gantt-row-bars';
                
                // 计算任务条的位置和宽度
                const startOffset = this.getDateOffset(task.start);
                const width = this.getDateOffset(task.end) - startOffset;
                
                const bar = document.createElement('div');
                bar.className = 'gantt-bar';
                bar.style.left = `${startOffset}%`;
                bar.style.width = `${width}%`;
                bar.style.backgroundColor = this.colors[taskIndex % this.colors.length];
                bar.setAttribute('data-task-id', task.id);
                
                // 任务条中显示任务名称
                if (width > 10) { // 只在宽度足够时显示文本
                    bar.textContent = task.label;
                }
                
                // 添加任务详细信息为自定义属性
                bar.setAttribute('data-start', task.start.toLocaleString());
                bar.setAttribute('data-end', task.end.toLocaleString());
                bar.setAttribute('data-duration', task.duration.toFixed(1) + '小时');
                
                rowBars.appendChild(bar);
                row.appendChild(rowHeader);
                row.appendChild(rowBars);
                ganttContainer.appendChild(row);
            });
            
            resourceIndex++;
        }
        
        this.container.appendChild(ganttContainer);
    }

    createTimeline() {
        const timeline = document.createElement('div');
        timeline.className = 'gantt-timeline';
        
        // 计算日期范围内的每一天
        for (let d = new Date(this.startDate); d <= this.endDate; d.setDate(d.getDate() + 1)) {
            const day = document.createElement('div');
            day.className = 'gantt-day';
            
            const dayHeader = document.createElement('div');
            dayHeader.className = 'gantt-day-header';
            dayHeader.textContent = `${d.getMonth() + 1}/${d.getDate()}`;
            
            day.appendChild(dayHeader);
            timeline.appendChild(day);
        }
        
        return timeline;
    }

    createLegend() {
        const legend = document.createElement('div');
        legend.className = 'gantt-legend';
        
        // 为每种资源类型创建图例项
        let colorIndex = 0;
        for (const resource of Object.keys(this.resourceGroups)) {
            const legendItem = document.createElement('div');
            legendItem.className = 'legend-item';
            
            const colorBox = document.createElement('div');
            colorBox.className = 'legend-color';
            colorBox.style.backgroundColor = this.colors[colorIndex % this.colors.length];
            
            const resourceName = document.createElement('span');
            resourceName.textContent = resource;
            
            legendItem.appendChild(colorBox);
            legendItem.appendChild(resourceName);
            legend.appendChild(legendItem);
            
            colorIndex++;
        }
        
        this.container.appendChild(legend);
    }

    createDataTable() {
        const tableContainer = document.createElement('div');
        tableContainer.className = 'data-table-container mt-4';
        
        const table = document.createElement('table');
        table.className = 'data-table';
        
        // 创建表头
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        const headers = ['工单编号', '工序名称', '资源类型', '开始时间', '结束时间', '持续时长'];
        
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // 创建表体
        const tbody = document.createElement('tbody');
        
        this.data.forEach(item => {
            const row = document.createElement('tr');
            
            const createCell = (text) => {
                const cell = document.createElement('td');
                cell.textContent = text;
                return cell;
            };
            
            row.appendChild(createCell(item.workOrderId));
            row.appendChild(createCell(item.procedure));
            row.appendChild(createCell(item.resourceType));
            row.appendChild(createCell(new Date(item.startTime).toLocaleString()));
            row.appendChild(createCell(new Date(item.endTime).toLocaleString()));
            
            // 计算持续时间（小时）
            const duration = (new Date(item.endTime) - new Date(item.startTime)) / (1000 * 60 * 60);
            row.appendChild(createCell(duration.toFixed(1) + '小时'));
            
            tbody.appendChild(row);
        });
        
        table.appendChild(tbody);
        tableContainer.appendChild(table);
        this.container.appendChild(tableContainer);
    }

    initTooltip() {
        // 创建工具提示元素
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'gantt-tooltip';
        this.tooltip.style.display = 'none';
        document.body.appendChild(this.tooltip);
        
        // 为甘特图中的任务条添加鼠标事件
        const taskBars = document.querySelectorAll('.gantt-bar');
        taskBars.forEach(bar => {
            // 鼠标进入显示工具提示
            bar.addEventListener('mouseenter', (e) => {
                const taskId = bar.getAttribute('data-task-id');
                const startTime = bar.getAttribute('data-start');
                const endTime = bar.getAttribute('data-end');
                const duration = bar.getAttribute('data-duration');
                
                this.tooltip.innerHTML = `
                    <strong>开始:</strong> ${startTime}<br>
                    <strong>结束:</strong> ${endTime}<br>
                    <strong>时长:</strong> ${duration}
                `;
                
                this.tooltip.style.display = 'block';
                this.moveTooltip(e);
            });
            
            // 鼠标移动更新工具提示位置
            bar.addEventListener('mousemove', (e) => {
                this.moveTooltip(e);
            });
            
            // 鼠标离开隐藏工具提示
            bar.addEventListener('mouseleave', () => {
                this.tooltip.style.display = 'none';
            });
        });
    }

    moveTooltip(e) {
        const x = e.pageX + 10;
        const y = e.pageY + 10;
        this.tooltip.style.left = x + 'px';
        this.tooltip.style.top = y + 'px';
    }

    getDateOffset(date) {
        // 计算日期相对于起始日期的百分比位置
        const totalMs = this.endDate - this.startDate;
        const dateMs = date - this.startDate;
        return (dateMs / totalMs) * 100;
    }
}