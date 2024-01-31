let orderHistory = []; // Lưu trữ lịch sử đơn hàng
let tableStatus = {};  // Lưu trữ trạng thái và số lần order của mỗi bàn

function checkIn(tableId) {
    let currentTime = new Date().toLocaleTimeString();
    let tableCard = document.getElementById(`tableCard${tableId}`);
    tableCard.classList.add('table-active');
    document.getElementById(`orderButton${tableId}`).style.display = 'block'; // Hiển thị nút Order

    if (!tableStatus[tableId]) {
        tableStatus[tableId] = { ordersCount: 0, checkInTime: currentTime, checkOutTime: '' };
    }
    recordHistory('Check In - Bàn ' + tableId + ': ' + currentTime);
    tableStatus[tableId].checkInTime = currentTime; // Ghi nhận giờ Check In
}

function checkOut(tableId) {
    let currentTime = new Date().toLocaleTimeString();
    let tableCard = document.getElementById(`tableCard${tableId}`);
    tableCard.classList.remove('table-active');
    document.getElementById(`orderButton${tableId}`).style.display = 'none'; // Ẩn nút Order

    if (tableStatus[tableId]) {
        tableStatus[tableId].ordersCount += 1;
        tableStatus[tableId].checkOutTime = currentTime; // Ghi nhận giờ Check Out
    }
    recordHistory('Check Out - Bàn ' + tableId +  ': ' + currentTime);
    displayTableStatus();


    // Tạo thông tin đơn hàng
    const orderItems = [];
    const inputs = document.querySelectorAll(`#orderModal${tableId} input[type='text']`);
    inputs.forEach(input => {
        const quantity = parseInt(input.value);
        const itemName = input.id.replace('Qty', 'Name');
        if (quantity > 0) {
            let itemPrice = productPrices[document.getElementById(itemName).textContent];
            orderItems.push({ name: document.getElementById(itemName).textContent, quantity: quantity, price: itemPrice });
        }
    });
  //  console.log (orderItems)
    if (orderItems.length > 0) {
        // Tạo thông tin đơn hàng
        const currentOrder = {
            tableId,
            checkInTime: tableStatus[tableId].checkInTime,
            checkOutTime: currentTime,
            orderItems: orderItems,
            totalPrice: calculateTotalPrice(orderItems)
        };

        // Xuất file PDF
        exportToExcel(currentOrder);
    } else {
        alert("Vui lòng chọn món ăn trước khi check Out.");
    }
    removeOrderFromHistory(tableId);
    resetOrderModal(tableId); // Reset số lượng món về 0 khi Check Out
}

function exportToExcel(order) {
    // Tạo một mảng dữ liệu chứa thông tin đơn hàng, giờ Check In, Check Out và số lần Order
    const orderData = order.orderItems.map(item => ({
        "Món ăn": item.name,
        "Số lượng": item.quantity,
        "Giá tiền (VND)": item.price,
    }));

    // Thêm giờ Check In, Check Out và số lần Order vào dữ liệu đơn hàng
    orderData.unshift({ "Món ăn": "Giờ Check In", "Số lượng": order.checkInTime });
    orderData.unshift({ "Món ăn": "Giờ Check Out", "Số lượng": order.checkOutTime });
    //orderData.unshift({ "Món ăn": "Số lần Order", "Số lượng": tableStatus[order.tableId].ordersCount });

    // Tạo một workbook mới
    const workbook = XLSX.utils.book_new();

    // Tạo một worksheet cho thông tin đơn hàng
    const orderWorksheet = XLSX.utils.json_to_sheet(orderData);

    // Thêm worksheet thông tin đơn hàng vào workbook
    XLSX.utils.book_append_sheet(workbook, orderWorksheet, "Order Details");

    // Xác định tên tệp Excel
  
    const filename = `Bill_bàn_${order.tableId}.xlsx`;

    // Lưu tệp Excel và tải về
    XLSX.writeFile(workbook, filename);
}



function calculateTotalPrice(orderItems) {
    let totalPrice = 0;
    orderItems.forEach(item => {
        totalPrice += item.quantity * item.price;
    });
    return totalPrice;
}

function displayTableStatus() {
    let statusDiv = document.getElementById('tableStatus');
    statusDiv.innerHTML = ''; // Xóa trạng thái cũ

    for (const [tableId, status] of Object.entries(tableStatus)) {
        let p = document.createElement('p');
        p.textContent = `Bàn ${tableId}: Số lần order - ${status.ordersCount}, Check In: ${status.checkInTime}, Check Out: ${status.checkOutTime}`;
        statusDiv.appendChild(p);
    }
}

function resetOrderForm(tableId) {
    const inputs = document.querySelectorAll(`#orderModal${tableId} input[type='text']`);
    inputs.forEach(input => {
        input.value = 0;
    });
}

function recordHistory(text) {
    var historyDiv = document.getElementById('orderHistory');
    var p = document.createElement('p');
    p.textContent = text;
    historyDiv.appendChild(p);
}

function increment(itemId) {
    let quantity = document.getElementById(itemId);
    quantity.value = parseInt(quantity.value) + 1;
}

function decrement(itemId) {
    let quantity = document.getElementById(itemId);
    if (quantity.value > 0) {
        quantity.value = parseInt(quantity.value) - 1;
    }
}

function confirmOrder(tableId) {
    let orderItems = [];
    let totalPrice = 0;
    const inputs = document.querySelectorAll(`#orderModal${tableId} input[type='text']`);

    inputs.forEach(input => {
        const quantity = parseInt(input.value);
        const itemName = input.id.replace('Qty', 'Name');
        if (quantity > 0) {
            let itemPrice = productPrices[document.getElementById(itemName).textContent];
            totalPrice += itemPrice * quantity;
            orderItems.push({ name: document.getElementById(itemName).textContent, quantity: quantity, price: itemPrice });
        }
    });

    if (orderItems.length > 0) {
        addOrderToHistory(tableId, orderItems, totalPrice);
    } else {
        alert("Vui lòng chọn ít nhất một món ăn.");
    }
}

function addOrderToHistory(tableId, orderItems, totalPrice) {
    let currentTime = new Date().toLocaleTimeString();
    orderHistory.push({ tableId, orderItems, time: currentTime, totalPrice: totalPrice });
    displayOrderHistory();
}

let productPrices = {
    'Bánh mì nướng': 20000,
    'Bò nướng': 50000,
    // thêm các sản phẩm khác...
};

function displayOrderHistory() {
    let historyDiv = document.getElementById('orderHistory');
    historyDiv.innerHTML = '';

    let table = document.createElement('table');
    table.className = 'table table-striped';

    let thead = table.createTHead();
    let row = thead.insertRow();
    let th1 = document.createElement('th');
    let th2 = document.createElement('th');
    let th3 = document.createElement('th');
    th1.innerHTML = 'Món ăn';
    th2.innerHTML = 'Tổng số lượng';
    th3.innerHTML = 'Tổng giá tiền';
    row.appendChild(th1);
    row.appendChild(th2);
    row.appendChild(th3);

    let tbody = table.createTBody();

    let combinedOrders = combineOrders(orderHistory);
    for (const [itemName, itemInfo] of Object.entries(combinedOrders)) {
        let row = tbody.insertRow();
        let cell1 = row.insertCell(0);
        let cell2 = row.insertCell(1);
        let cell3 = row.insertCell(2);
        cell1.innerHTML = itemName;
        cell2.innerHTML = itemInfo.quantity;
        cell3.innerHTML = itemInfo.totalPrice.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
    }

    historyDiv.appendChild(table);
}

function combineOrders(orders) {
    let combined = {};
    orders.forEach(order => {
        order.orderItems.forEach(item => {
            if (combined[item.name]) {
                combined[item.name].quantity += parseInt(item.quantity);
                combined[item.name].totalPrice += item.price * item.quantity;
            } else {
                combined[item.name] = {
                    quantity: parseInt(item.quantity),
                    totalPrice: item.price * item.quantity
                };
            }
        });
    });
    return combined;
}

function removeOrderFromHistory(tableId) {
    orderHistory = orderHistory.filter(order => order.tableId !== tableId);
    displayOrderHistory();
}

function resetOrderModal(tableId) {
    const inputs = document.querySelectorAll(`#orderModal${tableId} input[type='text']`);
    inputs.forEach(input => input.value = 0);
}
