// month-calendar-script.js - IZOLOWANY skrypt
(function() {
    'use strict';
    
    // Używamy unikalnych nazw ze znacznikiem "calendar"
    let calendarCurrentMonth = new Date().getMonth();
    let calendarCurrentYear = new Date().getFullYear();
    let calendarCurrentUser = null;
    let calendarReservations = [];

    // Inicjalizacja po załadowaniu DOM
    document.addEventListener('DOMContentLoaded', function() {
        console.log('Inicjalizacja kalendarza miesiąca...');
        
        // Sprawdź czy użytkownik jest zalogowany
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            try {
                calendarCurrentUser = JSON.parse(userData);
                console.log('Użytkownik:', calendarCurrentUser);
            } catch (e) {
                console.error('Błąd parsowania użytkownika:', e);
                calendarCurrentUser = { name: 'Administrator', login: 'admin' };
            }
        } else {
            console.warn('Brak zalogowanego użytkownika');
            calendarCurrentUser = { name: 'Administrator', login: 'admin' };
        }
        
        // Ustaw nazwę użytkownika
        const userDisplay = document.getElementById('userDisplay');
        if (userDisplay) {
            userDisplay.textContent = 'Zalogowany jako: ' + calendarCurrentUser.name;
        }
        
        // Załaduj rezerwacje
        loadCalendarReservations();
        
        // Inicjalizuj kalendarz
        initCalendar();
        
        // Aktualizuj datę
        updateLastUpdate();
    });

    // Załaduj rezerwacje
    function loadCalendarReservations() {
        try {
            const savedReservations = localStorage.getItem('carReservations');
            if (savedReservations) {
                calendarReservations = JSON.parse(savedReservations);
                console.log('Załadowno rezerwacje:', calendarReservations.length);
            }
        } catch (e) {
            console.error('Błąd ładowania rezerwacji:', e);
            calendarReservations = [];
        }
    }

    // Pobierz dane aut
    function getCalendarCars() {
        // Sprawdź czy CARS jest zdefiniowany globalnie
        if (typeof window.CARS !== 'undefined' && window.CARS) {
            return window.CARS;
        }
        
        // Fallback
        return [
            { id: "Auto1", name: "Skoda Octavia 1", plate: "RZ 12345" },
            { id: "Auto2", name: "Skoda Octavia 2", plate: "RZ 23456" },
            { id: "Auto3", name: "Skoda Octavia 3", plate: "RZ 34567"},
            { id: "Auto4", name: "Skoda Superb", plate: "RZ 45678"},
            { id: "Auto5", name: "Hyundai Tucson 1", plate: "RZ 56789" },
            { id: "Auto6", name: "Hyundai Tucson 2", plate: "RZ 67890" }
        ];
    }

    // Inicjalizuj kalendarz
    function initCalendar() {
        const calendarContainer = document.getElementById('monthCalendar');
        if (!calendarContainer) {
            console.error('Nie znaleziono kontenera kalendarza!');
            return;
        }
        
        // Utwórz strukturę HTML
        calendarContainer.innerHTML = `
            <div class="calendar-controls">
                <button id="prevMonthBtn" class="btn-nav">
                    <i class="fas fa-chevron-left"></i> Poprzedni miesiąc
                </button>
                <h2 id="currentMonthTitle" class="month-title"></h2>
                <button id="nextMonthBtn" class="btn-nav">
                    Następny miesiąc <i class="fas fa-chevron-right"></i>
                </button>
            </div>
            <div id="calendarGrid" class="multi-calendar-grid"></div>
        `;
        
        // Wygeneruj kalendarz
        generateCalendarView();
        
        // Dodaj event listeners
        setTimeout(function() {
            const prevBtn = document.getElementById('prevMonthBtn');
            const nextBtn = document.getElementById('nextMonthBtn');
            
            if (prevBtn) {
                prevBtn.addEventListener('click', function() {
                    calendarCurrentMonth--;
                    if (calendarCurrentMonth < 0) {
                        calendarCurrentMonth = 11;
                        calendarCurrentYear--;
                    }
                    generateCalendarView();
                    updateCalendarStats();
                });
            }
            
            if (nextBtn) {
                nextBtn.addEventListener('click', function() {
                    calendarCurrentMonth++;
                    if (calendarCurrentMonth > 11) {
                        calendarCurrentMonth = 0;
                        calendarCurrentYear++;
                    }
                    generateCalendarView();
                    updateCalendarStats();
                });
            }
        }, 100);
        
        // Załaduj statystyki
        updateCalendarStats();
    }

    // Wygeneruj widok kalendarza
    function generateCalendarView() {
        const calendarGrid = document.getElementById('calendarGrid');
        if (!calendarGrid) return;
        
        // Ustaw tytuł miesiąca
        const monthNames = [
            'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
            'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
        ];
        
        const monthTitle = document.getElementById('currentMonthTitle');
        if (monthTitle) {
            monthTitle.textContent = monthNames[calendarCurrentMonth] + ' ' + calendarCurrentYear;
        }
        
        // Wyczyść kalendarz
        calendarGrid.innerHTML = '';
        
        // Pobierz dane aut
        const cars = getCalendarCars();
        
        // Stwórz kalendarz dla każdego auta
        cars.forEach(car => {
            const carCalendar = createCarCalendarView(car);
            calendarGrid.appendChild(carCalendar);
        });
    }

    // Stwórz kalendarz dla auta
    function createCarCalendarView(car) {
        const calendarDiv = document.createElement('div');
        calendarDiv.className = 'car-calendar';
        
        // Nagłówek
        const header = document.createElement('div');
        header.className = 'car-calendar-header';
        header.innerHTML = '<h3><i class="fas fa-car"></i> ' + car.name + ' (' + car.plate + ')</h3>';
        calendarDiv.appendChild(header);
        
        // Tabela kalendarza
        const table = document.createElement('table');
        table.className = 'month-calendar-table';
        
        // Nagłówki dni
        const dayNames = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        dayNames.forEach(day => {
            const th = document.createElement('th');
            th.textContent = day;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Ciało kalendarza
        const tbody = document.createElement('tbody');
        
        // Oblicz pierwszy dzień miesiąca
        const firstDay = new Date(calendarCurrentYear, calendarCurrentMonth, 1);
        const lastDay = new Date(calendarCurrentYear, calendarCurrentMonth + 1, 0);
        const daysInMonth = lastDay.getDate();
        
        let startingDay = firstDay.getDay();
        if (startingDay === 0) startingDay = 6;
        else startingDay = startingDay - 1;
        
        let dayCounter = 1;
        const today = new Date();
        const isCurrentMonth = today.getMonth() === calendarCurrentMonth && 
                               today.getFullYear() === calendarCurrentYear;
        
        // Tworzenie kalendarza
        for (let week = 0; week < 6; week++) {
            const row = document.createElement('tr');
            
            for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
                const cell = document.createElement('td');
                
                if ((week === 0 && dayOfWeek < startingDay) || dayCounter > daysInMonth) {
                    cell.className = 'empty-cell';
                    cell.textContent = '';
                    cell.title = '';
                } else {
                    // Normalny dzień
                    const dayDate = new Date(calendarCurrentYear, calendarCurrentMonth, dayCounter);
                    
                    // Sprawdź czy to dzisiaj
                    if (isCurrentMonth && dayCounter === today.getDate()) {
                        cell.classList.add('today');
                    }
                    
                    // Znajdź rezerwacje dla tego dnia i auta
                    let reservationForDay = null;
                    let isUserReservation = false;
                    
                    // Sprawdź rezerwacje
                    for (let i = 0; i < calendarReservations.length; i++) {
                        const reservation = calendarReservations[i];
                        
                        // Sprawdź czy rezerwacja dotyczy tego auta i jest aktywna
                        if (reservation.carId !== car.id || reservation.status === 'cancelled') {
                            continue;
                        }
                        
                        try {
                            // Parsuj daty
                            const startDate = parseCalendarDate(reservation.startDate);
                            const endDate = parseCalendarDate(reservation.endDate);
                            
                            if (!startDate || !endDate) continue;
                            
                            // Ustaw czas na 12:00 dla wszystkich
                            startDate.setHours(12, 0, 0, 0);
                            endDate.setHours(12, 0, 0, 0);
                            dayDate.setHours(12, 0, 0, 0);
                            
                            // Sprawdź czy dzień mieści się w zakresie rezerwacji
                            if (dayDate >= startDate && dayDate <= endDate) {
                                reservationForDay = reservation;
                                isUserReservation = (reservation.login === calendarCurrentUser.login);
                                break;
                            }
                        } catch (e) {
                            console.error('Błąd sprawdzania rezerwacji:', e);
                        }
                    }
                    
                    // Ustaw styl komórki
                    if (reservationForDay) {
                        if (isUserReservation) {
                            cell.classList.add('my-reservation');
                            cell.title = 'Twoja rezerwacja\nCel: ' + (reservationForDay.purpose || 'brak') + 
                                       '\nDział: ' + (reservationForDay.department || 'brak');
                        } else {
                            cell.classList.add('reserved');
                            cell.title = 'Zajęte przez: ' + (reservationForDay.employeeName || 'nieznany') + 
                                       '\nCel: ' + (reservationForDay.purpose || 'brak') + 
                                       '\nDział: ' + (reservationForDay.department || 'brak');
                        }
                    } else {
                        cell.classList.add('available');
                        cell.title = 'Wolne - dostępne do rezerwacji';
                    }
                    
                    cell.textContent = dayCounter;
                    dayCounter++;
                }
                
                row.appendChild(cell);
            }
            
            tbody.appendChild(row);
            
            if (dayCounter > daysInMonth) break;
        }
        
        table.appendChild(tbody);
        calendarDiv.appendChild(table);
        
        return calendarDiv;
    }

    // Parsuj datę
    function parseCalendarDate(dateString) {
        if (!dateString) return null;
        
        try {
            // Format YYYY-MM-DD
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
                const parts = dateString.split('-').map(Number);
                return new Date(parts[0], parts[1] - 1, parts[2]);
            }
            
            // Inne formaty
            const date = new Date(dateString);
            return isNaN(date.getTime()) ? null : date;
        } catch (e) {
            console.error('Błąd parsowania daty:', dateString, e);
            return null;
        }
    }

    // Aktualizuj statystyki
    function updateCalendarStats() {
        const statsContainer = document.getElementById('monthStats');
        if (!statsContainer) return;
        
        const monthReservations = [];
        let totalDays = 0;
        
        // Filtruj rezerwacje dla bieżącego miesiąca
        for (let i = 0; i < calendarReservations.length; i++) {
            const res = calendarReservations[i];
            try {
                if (!res.startDate || res.status === 'cancelled') continue;
                
                const startDate = parseCalendarDate(res.startDate);
                if (!startDate) continue;
                
                // Sprawdź czy rezerwacja jest w bieżącym miesiącu
                if (startDate.getMonth() === calendarCurrentMonth && 
                    startDate.getFullYear() === calendarCurrentYear) {
                    monthReservations.push(res);
                    
                    // Oblicz liczbę dni
                    const endDate = parseCalendarDate(res.endDate);
                    if (endDate) {
                        const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
                        totalDays += days;
                    }
                }
            } catch (e) {
                console.error('Błąd przetwarzania rezerwacji:', e);
            }
        }
        
        // Wyświetl statystyki
        statsContainer.innerHTML = `
            <div class="stat-item compact">
                <h4><i class="fas fa-chart-pie"></i> Podsumowanie miesiąca</h4>
                <p class="stat-value large">${monthReservations.length}</p>
                <p class="stat-label">Łącznie rezerwacji</p>
                <p class="stat-value large">${totalDays}</p>
                <p class="stat-label">Łączna liczba dni</p>
            </div>
            <div class="stat-item compact">
                <h4><i class="fas fa-building"></i> Informacja</h4>
                <p>Kalendarz pokazuje dostępność aut w bieżącym miesiącu.</p>
                <p>Kliknij na dzień, aby zobaczyć szczegóły rezerwacji.</p>
            </div>
        `;
    }

    // Aktualizuj datę ostatniej aktualizacji
    function updateLastUpdate() {
        const lastUpdateElement = document.getElementById('lastUpdate');
        if (lastUpdateElement) {
            lastUpdateElement.textContent = 'Ostatnia aktualizacja: ' + new Date().toLocaleString('pl-PL');
        }
    }

    // Eksport do PDF
    function exportMonthCalendarPDF() {
        const monthNames = [
            'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
            'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
        ];
        const monthName = monthNames[calendarCurrentMonth];
        
        alert('Eksport do PDF dla ' + monthName + ' ' + calendarCurrentYear + 
              '\n\nAby wyeksportować do PDF, użyj funkcji drukowania przeglądarki (Ctrl+P) i wybierz "Zapisz jako PDF".');
    }

    // Eksport do Excel
    function exportMonthCalendarExcel() {
        try {
            const monthNames = [
                'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
                'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
            ];
            const monthName = monthNames[calendarCurrentMonth];
            
            const monthReservations = [];
            
            // Filtruj rezerwacje
            for (let i = 0; i < calendarReservations.length; i++) {
                const res = calendarReservations[i];
                try {
                    if (!res.startDate || res.status === 'cancelled') continue;
                    
                    const startDate = parseCalendarDate(res.startDate);
                    if (!startDate) continue;
                    
                    if (startDate.getMonth() === calendarCurrentMonth && 
                        startDate.getFullYear() === calendarCurrentYear) {
                        monthReservations.push(res);
                    }
                } catch (e) {
                    continue;
                }
            }
            
            if (monthReservations.length === 0) {
                alert('Brak rezerwacji dla ' + monthName + ' ' + calendarCurrentYear);
                return;
            }
            
            // Utwórz CSV
            let csv = 'Data rozpoczęcia,Data zakończenia,Auto,Pracownik,Dział,Cel podróży\n';
            
            for (let i = 0; i < monthReservations.length; i++) {
                const res = monthReservations[i];
                try {
                    const startDate = parseCalendarDate(res.startDate);
                    const endDate = parseCalendarDate(res.endDate);
                    
                    if (!startDate || !endDate) continue;
                    
                    const startDateStr = startDate.toLocaleDateString('pl-PL');
                    const endDateStr = endDate.toLocaleDateString('pl-PL');
                    const cars = getCalendarCars();
                    let carName = res.carId;
                    
                    for (let j = 0; j < cars.length; j++) {
                        if (cars[j].id === res.carId) {
                            carName = cars[j].name + ' (' + cars[j].plate + ')';
                            break;
                        }
                    }
                    
                    csv += '"' + startDateStr + '","' + endDateStr + '","' + carName + '","' + 
                           (res.employeeName || 'Nieznany') + '","' + (res.department || 'Nieznany') + 
                           '","' + (res.purpose || 'Brak') + '"\n';
                } catch (e) {
                    console.error('Błąd przetwarzania:', e);
                }
            }
            
            // Pobierz plik
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.href = url;
            link.download = 'rezerwacje-' + monthName + '-' + calendarCurrentYear + '.csv';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            alert('Eksport do Excel zakończony!\nPlik: rezerwacje-' + monthName + '-' + calendarCurrentYear + '.csv');
            
        } catch (error) {
            console.error('Błąd eksportu:', error);
            alert('Błąd eksportu do Excel: ' + error.message);
        }
    }

    // Drukuj kalendarz
    function printMonthCalendar() {
        window.print();
    }

    // Funkcja odświeżania
    function refreshCalendar() {
        console.log('Odświeżanie kalendarza...');
        loadCalendarReservations();
        generateCalendarView();
        updateCalendarStats();
        updateLastUpdate();
    }

    // Eksportuj funkcje do window
    window.calendarRefresh = refreshCalendar;
    window.exportMonthCalendarExcel = exportMonthCalendarExcel;
    window.exportMonthCalendarPDF = exportMonthCalendarPDF;
    window.printMonthCalendar = printMonthCalendar;

})(); // Koniec IIFE