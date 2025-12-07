// Skrypt dla raportów miesięcznych

document.addEventListener('DOMContentLoaded', function() {
    // Sprawdź czy użytkownik jest zalogowany
    const user = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!user || (user.role !== 'admin' && user.login !== 'admin')) {
        alert('Brak uprawnień do przeglądania raportów!');
        window.location.href = 'index.html';
        return;
    }
    
    // Ustaw nazwę użytkownika
    const userDisplay = document.getElementById('userDisplay');
    if (userDisplay) {
        userDisplay.textContent = `Zalogowany jako: ${user.name || user.login}`;
    }
    
    // Ustaw bieżący miesiąc i rok
    const now = new Date();
    const reportMonth = document.getElementById('reportMonth');
    const reportYear = document.getElementById('reportYear');
    
    if (reportMonth) reportMonth.value = now.getMonth() + 1;
    if (reportYear) reportYear.value = now.getFullYear();
    
    // Obsługa przycisków
    const generateReportBtn = document.getElementById('generateReport');
    const exportReportBtn = document.getElementById('exportReport');
    
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', generateReport);
    }
    
    if (exportReportBtn) {
        exportReportBtn.addEventListener('click', exportReportToPDF);
    }
    
    // Załaduj dane
    loadReservationsForReport();
});

let currentReport = null;
let reservations = [];

// Załaduj rezerwacje dla raportu
function loadReservationsForReport() {
    const savedReservations = localStorage.getItem('carReservations');
    if (savedReservations) {
        try {
            reservations = JSON.parse(savedReservations);
        } catch (e) {
            console.error('Błąd parsowania rezerwacji:', e);
            reservations = [];
        }
    }
}

// Generuj raport
function generateReport() {
    const month = parseInt(document.getElementById('reportMonth').value);
    const year = parseInt(document.getElementById('reportYear').value);
    const reportType = document.getElementById('reportType').value;
    
    // Generuj raport
    currentReport = generateMonthlyReport(month, year);
    if (!currentReport) {
        alert('Nie udało się wygenerować raportu. Sprawdź dane.');
        return;
    }
    
    currentReport.type = reportType;
    currentReport.monthName = getMonthName(month);
    currentReport.year = year;
    currentReport.month = month;
    
    // Wyświetl raport
    displayReport(currentReport, reportType);
    
    // Aktywuj przycisk eksportu
    const exportBtn = document.getElementById('exportReport');
    if (exportBtn) {
        exportBtn.disabled = false;
    }
    
    // Ukryj komunikat "brak raportu"
    const noReport = document.getElementById('noReport');
    const reportResults = document.getElementById('reportResults');
    
    if (noReport) noReport.classList.add('hidden');
    if (reportResults) reportResults.classList.remove('hidden');
}

// Funkcja do generowania miesięcznego raportu (musi istnieć w Twoim kodzie)
function generateMonthlyReport(month, year) {
    if (!reservations || reservations.length === 0) {
        console.log('Brak rezerwacji do analizy');
        return null;
    }
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    // Filtruj rezerwacje dla danego miesiąca
    const monthReservations = reservations.filter(r => {
        if (!r || !r.startDate) return false;
        const resDate = new Date(r.startDate);
        return resDate >= startDate && resDate <= endDate && r.status !== 'cancelled';
    });
    
    if (monthReservations.length === 0) {
        return {
            totalReservations: 0,
            totalDays: 0,
            byCar: {},
            byDepartment: {},
            byEmployee: {},
            month: month,
            year: year
        };
    }
    
    const report = {
        totalReservations: monthReservations.length,
        totalDays: 0,
        byCar: {},
        byDepartment: {},
        byEmployee: {},
        month: month,
        year: year
    };
    
    // Analizuj rezerwacje
    monthReservations.forEach(reservation => {
        // Oblicz liczbę dni
        const daysCount = calculateDays(reservation.startDate, reservation.endDate);
        report.totalDays += daysCount;
        
        // Statystyki według auta
        const carId = reservation.carId || reservation.carName;
        if (carId) {
            if (!report.byCar[carId]) {
                report.byCar[carId] = { count: 0, days: 0 };
            }
            report.byCar[carId].count++;
            report.byCar[carId].days += daysCount;
        }
        
        // Statystyki według działu
        const department = reservation.department || 'Nieznany';
        if (!report.byDepartment[department]) {
            report.byDepartment[department] = { count: 0, days: 0 };
        }
        report.byDepartment[department].count++;
        report.byDepartment[department].days += daysCount;
        
        // Statystyki według pracownika
        const employeeName = reservation.employeeName || 'Nieznany';
        if (!report.byEmployee[employeeName]) {
            report.byEmployee[employeeName] = { 
                count: 0, 
                days: 0,
                department: department
            };
        }
        report.byEmployee[employeeName].count++;
        report.byEmployee[employeeName].days += daysCount;
    });
    
    return report;
}

// Wyświetl raport
function displayReport(report, type) {
    const resultsContainer = document.getElementById('reportResults');
    if (!resultsContainer) {
        console.error('Element reportResults nie znaleziony');
        return;
    }
    
    switch(type) {
        case 'summary':
            displaySummaryReport(report, resultsContainer);
            break;
        case 'detailed':
            displayDetailedReport(report, resultsContainer);
            break;
        case 'byCar':
            displayByCarReport(report, resultsContainer);
            break;
        case 'byDepartment':
            displayByDepartmentReport(report, resultsContainer);
            break;
        case 'byEmployee':
            displayByEmployeeReport(report, resultsContainer);
            break;
        default:
            resultsContainer.innerHTML = '<p class="text-center">Nieznany typ raportu</p>';
    }
}

// Podsumowanie
function displaySummaryReport(report, container) {
    const avgDays = report.totalReservations > 0 ? (report.totalDays / report.totalReservations).toFixed(1) : 0;
    
    container.innerHTML = `
        <div class="report-summary">
            <div class="report-card">
                <h4><i class="fas fa-chart-pie"></i> Podsumowanie miesiąca</h4>
                <p class="report-stat">${report.totalReservations}</p>
                <p class="report-label">Łącznie rezerwacji</p>
                <p class="report-stat">${report.totalDays}</p>
                <p class="report-label">Łączna liczba dni</p>
                <p class="report-label">Średnio: ${avgDays} dni/rezerwacji</p>
            </div>
            
            <div class="report-card">
                <h4><i class="fas fa-car"></i> Najbardziej popularne auto</h4>
                ${getMostPopularCar(report)}
            </div>
            
            <div class="report-card">
                <h4><i class="fas fa-building"></i> Najaktywniejszy dział</h4>
                ${getMostActiveDepartment(report)}
            </div>
            
            <div class="report-card">
                <h4><i class="fas fa-user"></i> Najaktywniejszy pracownik</h4>
                ${getMostActiveEmployee(report)}
            </div>
        </div>
        
        ${Object.keys(report.byCar).length > 0 ? `
            <div class="report-card" style="margin-top: 30px;">
                <h4><i class="fas fa-calendar-check"></i> Wykorzystanie aut (liczba dni)</h4>
                <div class="car-usage-chart">
                    ${generateCarUsageChart(report)}
                </div>
            </div>
        ` : ''}
    `;
}

// Szczegółowy raport
function displayDetailedReport(report, container) {
    // Pobierz szczegółowe rezerwacje
    const monthReservations = getReservationsForMonth(report.month, report.year);
    
    let reservationsHtml = '';
    if (monthReservations.length > 0) {
        reservationsHtml = `
            <table class="report-table">
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Auto</th>
                        <th>Pracownik</th>
                        <th>Dział</th>
                        <th>Liczba dni</th>
                        <th>Cel</th>
                    </tr>
                </thead>
                <tbody>
                    ${monthReservations.map(reservation => `
                        <tr>
                            <td>${formatDate(reservation.startDate)} - ${formatDate(reservation.endDate)}</td>
                            <td>${reservation.carName || reservation.carId || 'Nieznane'}</td>
                            <td>${reservation.employeeName || 'Nieznany'}</td>
                            <td>${reservation.department || 'Nieznany'}</td>
                            <td>${reservation.daysCount || calculateDays(reservation.startDate, reservation.endDate)}</td>
                            <td>${reservation.purpose || 'Nie podano'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <p style="margin-top: 15px; font-size: 14px; color: #666;">
                Łącznie: ${monthReservations.length} rezerwacji
            </p>
        `;
    } else {
        reservationsHtml = '<p class="text-center">Brak rezerwacji w wybranym miesiącu</p>';
    }
    
    container.innerHTML = `
        <div class="report-card">
            <h4><i class="fas fa-list-alt"></i> Szczegółowa lista rezerwacji - ${report.monthName} ${report.year}</h4>
            ${reservationsHtml}
        </div>
    `;
}

// Raport według aut
function displayByCarReport(report, container) {
    if (Object.keys(report.byCar).length === 0) {
        container.innerHTML = `
            <div class="report-card">
                <h4><i class="fas fa-car"></i> Wykorzystanie aut - ${report.monthName} ${report.year}</h4>
                <p class="text-center">Brak danych o autach w tym miesiącu</p>
            </div>
        `;
        return;
    }
    
    let carsHtml = '';
    Object.keys(report.byCar).forEach(carId => {
        const carName = getCarNameById(carId);
        const stats = report.byCar[carId];
        const percentage = report.totalDays > 0 ? ((stats.days / report.totalDays) * 100).toFixed(1) : 0;
        
        carsHtml += `
            <tr>
                <td>${carName}</td>
                <td>${stats.count}</td>
                <td>${stats.days}</td>
                <td>${percentage}%</td>
                <td>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(percentage, 100)}%"></div>
                    </div>
                </td>
            </tr>
        `;
    });
    
    container.innerHTML = `
        <div class="report-card">
            <h4><i class="fas fa-car"></i> Wykorzystanie aut - ${report.monthName} ${report.year}</h4>
            <table class="report-table">
                <thead>
                    <tr>
                        <th>Auto</th>
                        <th>Liczba rezerwacji</th>
                        <th>Liczba dni</th>
                        <th>Procent wykorzystania</th>
                        <th>Wykres</th>
                    </tr>
                </thead>
                <tbody>
                    ${carsHtml}
                </tbody>
            </table>
        </div>
    `;
}

// Raport według działów
function displayByDepartmentReport(report, container) {
    if (Object.keys(report.byDepartment).length === 0) {
        container.innerHTML = `
            <div class="report-card">
                <h4><i class="fas fa-building"></i> Rezerwacje według działów - ${report.monthName} ${report.year}</h4>
                <p class="text-center">Brak danych o działach w tym miesiącu</p>
            </div>
        `;
        return;
    }
    
    let departmentsHtml = '';
    Object.keys(report.byDepartment).forEach(dept => {
        const stats = report.byDepartment[dept];
        const percentage = report.totalReservations > 0 ? ((stats.count / report.totalReservations) * 100).toFixed(1) : 0;
        
        departmentsHtml += `
            <tr>
                <td>${dept}</td>
                <td>${stats.count}</td>
                <td>${stats.days}</td>
                <td>${percentage}%</td>
                <td>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(percentage, 100)}%"></div>
                    </div>
                </td>
            </tr>
        `;
    });
    
    container.innerHTML = `
        <div class="report-card">
            <h4><i class="fas fa-building"></i> Rezerwacje według działów - ${report.monthName} ${report.year}</h4>
            <table class="report-table">
                <thead>
                    <tr>
                        <th>Dział</th>
                        <th>Liczba rezerwacji</th>
                        <th>Liczba dni</th>
                        <th>Procent udziału</th>
                        <th>Wykres</th>
                    </tr>
                </thead>
                <tbody>
                    ${departmentsHtml}
                </tbody>
            </table>
        </div>
    `;
}

// Raport według pracowników
function displayByEmployeeReport(report, container) {
    if (Object.keys(report.byEmployee).length === 0) {
        container.innerHTML = `
            <div class="report-card">
                <h4><i class="fas fa-users"></i> Aktywność pracowników - ${report.monthName} ${report.year}</h4>
                <p class="text-center">Brak danych o pracownikach w tym miesiącu</p>
            </div>
        `;
        return;
    }
    
    let employeesHtml = '';
    Object.keys(report.byEmployee).forEach(employee => {
        const stats = report.byEmployee[employee];
        const percentage = report.totalReservations > 0 ? ((stats.count / report.totalReservations) * 100).toFixed(1) : 0;
        
        employeesHtml += `
            <tr>
                <td>${employee}</td>
                <td>${stats.department || 'Nieznany'}</td>
                <td>${stats.count}</td>
                <td>${stats.days}</td>
                <td>${percentage}%</td>
            </tr>
        `;
    });
    
    container.innerHTML = `
        <div class="report-card">
            <h4><i class="fas fa-users"></i> Aktywność pracowników - ${report.monthName} ${report.year}</h4>
            <table class="report-table">
                <thead>
                    <tr>
                        <th>Pracownik</th>
                        <th>Dział</th>
                        <th>Liczba rezerwacji</th>
                        <th>Liczba dni</th>
                        <th>Procent udziału</th>
                    </tr>
                </thead>
                <tbody>
                    ${employeesHtml}
                </tbody>
            </table>
        </div>
    `;
}

// Eksportuj raport do PDF
function exportReportToPDF() {
    if (!currentReport) {
        alert('Najpierw wygeneruj raport!');
        return;
    }
    
    // Używamy html2pdf
    const element = document.getElementById('reportResults');
    if (!element) {
        alert('Nie znaleziono zawartości raportu do eksportu');
        return;
    }
    
    const opt = {
        margin:       10,
        filename:     `raport-${currentReport.monthName.toLowerCase()}-${currentReport.year}-${currentReport.type}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // Dodaj nagłówek
    const header = document.createElement('div');
    header.innerHTML = `
        <h1 style="color: #2a5298; text-align: center;">Raport rezerwacji aut</h1>
        <h3 style="text-align: center;">${currentReport.monthName} ${currentReport.year} - ${getReportTypeName(currentReport.type)}</h3>
        <p style="text-align: center; color: #666;">Wygenerowano: ${new Date().toLocaleString('pl-PL')}</p>
        <hr style="margin: 20px 0;">
    `;
    
    const content = element.cloneNode(true);
    content.insertBefore(header, content.firstChild);
    
    // Eksportuj do PDF
    html2pdf().set(opt).from(content).save();
}

// Funkcje pomocnicze
function getMonthName(month) {
    const monthNames = [
        'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
        'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
    ];
    return monthNames[month - 1] || 'Nieznany';
}

function getReportTypeName(type) {
    const typeNames = {
        'summary': 'Podsumowanie',
        'detailed': 'Szczegółowy',
        'byCar': 'Według aut',
        'byDepartment': 'Według działów',
        'byEmployee': 'Według pracowników'
    };
    return typeNames[type] || type;
}

function getMostPopularCar(report) {
    if (Object.keys(report.byCar).length === 0) {
        return '<p class="report-label">Brak danych</p>';
    }
    
    let popularCar = null;
    let maxDays = 0;
    
    Object.keys(report.byCar).forEach(carId => {
        if (report.byCar[carId].days > maxDays) {
            maxDays = report.byCar[carId].days;
            popularCar = carId;
        }
    });
    
    if (popularCar) {
        const carName = getCarNameById(popularCar);
        return `
            <p class="report-stat">${carName}</p>
            <p class="report-label">${maxDays} dni (${report.byCar[popularCar].count} rezerwacji)</p>
        `;
    }
    
    return '<p class="report-label">Brak danych</p>';
}

function getCarNameById(carId) {
    // Sprawdź czy CARS istnieje globalnie
    if (typeof CARS !== 'undefined' && Array.isArray(CARS)) {
        const car = CARS.find(c => c.id === carId);
        return car ? car.name : carId;
    }
    
    // Sprawdź w localStorage
    const carsFromStorage = localStorage.getItem('cars');
    if (carsFromStorage) {
        try {
            const cars = JSON.parse(carsFromStorage);
            const car = cars.find(c => c.id === carId);
            return car ? car.name : carId;
        } catch (e) {
            console.error('Błąd parsowania aut:', e);
        }
    }
    
    return carId;
}

function getMostActiveDepartment(report) {
    if (Object.keys(report.byDepartment).length === 0) {
        return '<p class="report-label">Brak danych</p>';
    }
    
    let activeDept = null;
    let maxReservations = 0;
    
    Object.keys(report.byDepartment).forEach(dept => {
        if (report.byDepartment[dept].count > maxReservations) {
            maxReservations = report.byDepartment[dept].count;
            activeDept = dept;
        }
    });
    
    if (activeDept) {
        return `
            <p class="report-stat">${activeDept}</p>
            <p class="report-label">${maxReservations} rezerwacji (${report.byDepartment[activeDept].days} dni)</p>
        `;
    }
    
    return '<p class="report-label">Brak danych</p>';
}

function getMostActiveEmployee(report) {
    if (Object.keys(report.byEmployee).length === 0) {
        return '<p class="report-label">Brak danych</p>';
    }
    
    let activeEmployee = null;
    let maxReservations = 0;
    
    Object.keys(report.byEmployee).forEach(employee => {
        if (report.byEmployee[employee].count > maxReservations) {
            maxReservations = report.byEmployee[employee].count;
            activeEmployee = employee;
        }
    });
    
    if (activeEmployee) {
        return `
            <p class="report-stat">${activeEmployee}</p>
            <p class="report-label">${maxReservations} rezerwacji (${report.byEmployee[activeEmployee].days} dni)</p>
            <p class="report-label">Dział: ${report.byEmployee[activeEmployee].department || 'Nieznany'}</p>
        `;
    }
    
    return '<p class="report-label">Brak danych</p>';
}

function generateCarUsageChart(report) {
    if (Object.keys(report.byCar).length === 0) {
        return '<p>Brak danych o wykorzystaniu aut</p>';
    }
    
    let chartHtml = '';
    Object.keys(report.byCar).forEach((carId, index) => {
        const carName = getCarNameById(carId);
        const stats = report.byCar[carId];
        const percentage = report.totalDays > 0 ? ((stats.days / report.totalDays) * 100).toFixed(1) : 0;
        
        chartHtml += `
            <div style="margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span>${carName}</span>
                    <span>${stats.days} dni (${percentage}%)</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${Math.min(percentage, 100)}%; background-color: ${getColorForCar(index)};"></div>
                </div>
            </div>
        `;
    });
    
    return chartHtml;
}

function getColorForCar(index) {
    const colors = [
        '#2a5298', '#e74c3c', '#27ae60', '#f39c12', 
        '#9b59b6', '#1abc9c', '#d35400', '#34495e'
    ];
    return colors[index % colors.length] || '#2a5298';
}

function getReservationsForMonth(month, year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    return reservations.filter(r => {
        if (!r || !r.startDate) return false;
        const resDate = new Date(r.startDate);
        return resDate >= startDate && resDate <= endDate && r.status !== 'cancelled';
    });
}

function calculateDays(startDateStr, endDateStr) {
    try {
        const start = new Date(startDateStr);
        const end = new Date(endDateStr);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays + 1; // +1 bo włącznie z dniem końcowym
    } catch (e) {
        console.error('Błąd obliczania dni:', e);
        return 1;
    }
}

function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('pl-PL');
    } catch (e) {
        return dateString;
    }
}