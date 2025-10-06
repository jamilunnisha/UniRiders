// Global variables
let currentMode = 'student';
let availableAutosData = [
    {
        id: 1,
        driverName: 'Ravi Kumar',
        autoNumber: 'TN 20 AB 1234',
        phone: '+91 9876543210',
        rating: 4.8,
        location: 'MBU Main Gate',
        distance: 0.5,
        eta: 3,
        fare: 350,
        available: true,
        lat: 13.6288,
        lng: 79.4192
    },
    {
        id: 2,
        driverName: 'Suresh Babu',
        autoNumber: 'TN 20 CD 5678',
        phone: '+91 9876543211',
        rating: 4.6,
        location: 'Near Hostels',
        distance: 0.8,
        eta: 5,
        fare: 340,
        available: true,
        lat: 13.6285,
        lng: 79.4188
    },
    {
        id: 3,
        driverName: 'Mohan Das',
        autoNumber: 'TN 20 EF 9012',
        phone: '+91 9876543212',
        rating: 4.9,
        location: 'Library Block',
        distance: 0.3,
        eta: 2,
        fare: 360,
        available: true,
        lat: 13.6290,
        lng: 79.4195
    },
    {
        id: 4,
        driverName: 'Venkat Rao',
        autoNumber: 'TN 20 GH 3456',
        phone: '+91 9876543213',
        rating: 4.7,
        location: 'Sports Complex',
        distance: 1.2,
        eta: 4,
        fare: 355,
        available: true,
        lat: 13.6292,
        lng: 79.4198
    },
    {
        id: 5,
        driverName: 'Lakshman Reddy',
        autoNumber: 'TN 20 IJ 7890',
        phone: '+91 9876543214',
        rating: 4.5,
        location: 'Cafeteria',
        distance: 0.6,
        eta: 3,
        fare: 345,
        available: true,
        lat: 13.6286,
        lng: 79.4190
    },
    {
        id: 6,
        driverName: 'Rajesh Kumar',
        autoNumber: 'TN 20 KL 2468',
        phone: '+91 9876543215',
        rating: 4.4,
        location: 'Gate 2',
        distance: 0.9,
        eta: 4,
        fare: 365,
        available: true,
        lat: 13.6280,
        lng: 79.4185
    }
];

let routePricing = {
    'mbu-main-gate-tirupati': { distance: 18.0, baseFare: 350, duration: 40 },
    'mbu-hostels-tirupati': { distance: 17.8, baseFare: 340, duration: 38 },
    'mbu-library-tirupati': { distance: 18.2, baseFare: 355, duration: 41 },
    'mbu-cafeteria-tirupati': { distance: 17.9, baseFare: 345, duration: 39 },
    'mbu-sports-tirupati': { distance: 18.5, baseFare: 360, duration: 42 },
    'current-tirupati': { distance: 18.0, baseFare: 350, duration: 40 },
    'mbu-main-gate-tirupati-railway': { distance: 20.0, baseFare: 380, duration: 45 },
    'mbu-hostels-tirupati-railway': { distance: 19.8, baseFare: 375, duration: 44 },
    'mbu-main-gate-leela-mall': { distance: 15.5, baseFare: 280, duration: 35 },
    'mbu-hostels-leela-mall': { distance: 15.2, baseFare: 275, duration: 34 },
    'mbu-main-gate-tirupati-airport': { distance: 25.0, baseFare: 450, duration: 55 }
};

let activeBooking = null;
let trackingInterval = null;

// Initialize the application
function initApp() {
    updateAutoCount();
    updateLiveMap();
    updateStats();
    setCurrentTime();
    simulateRealTimeUpdates();
}

// Switch between different modes
function switchMode(mode) {
    currentMode = mode;
    
    // Update mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Show/hide panels
    document.getElementById('studentPanel').style.display = mode === 'student' ? 'block' : 'none';
    document.getElementById('driverPanel').style.display = mode === 'driver' ? 'block' : 'none';
    document.getElementById('adminPanel').style.display = mode === 'admin' ? 'block' : 'none';
    
    showAlert(`Switched to ${mode.charAt(0).toUpperCase() + mode.slice(1)} mode`, 'info');
}

// Calculate fare estimate
function calculateEstimate() {
    const from = document.getElementById('fromLocation').value;
    const to = document.getElementById('toLocation').value;
    const when = document.getElementById('whenTravel').value;
    const passengers = parseInt(document.getElementById('passengers').value);

    if (!from || !to) {
        document.getElementById('fareCard').style.display = 'none';
        return;
    }

    const routeKey = `${from}-${to}`;
    let routeInfo = routePricing[routeKey] || { distance: 15.0, baseFare: 280, duration: 35 };

    // Calculate dynamic pricing
    let finalFare = routeInfo.baseFare;
    let multipliers = [];

    // Peak hour pricing (7-10 AM, 5-8 PM)
    const hour = new Date().getHours();
    if ((hour >= 7 && hour <= 10) || (hour >= 17 && hour <= 20)) {
        finalFare *= 1.2;
        multipliers.push('Peak 1.2x');
    }

    // Immediate booking surcharge
    if (when === 'now') {
        finalFare *= 1.1;
        multipliers.push('Immediate 1.1x');
    }

    // Passenger pricing (slight discount for multiple passengers)
    if (passengers > 1) {
        const passengerMultiplier = 1 + (passengers - 1) * 0.3;
        finalFare *= passengerMultiplier;
        multipliers.push(`${passengers}P +${((passengerMultiplier - 1) * 100).toFixed(0)}%`);
    }

    // Update display
    document.getElementById('distanceValue').textContent = routeInfo.distance + ' km';
    document.getElementById('durationValue').textContent = routeInfo.duration + ' min';
    document.getElementById('demanddLevel').textContent = getCurrentDemandLevel();
    document.getElementById('finalFare').textContent = `₹${Math.round(finalFare)}`;
    document.getElementById('fareBreakdown').textContent = 
        `Base ₹${routeInfo.baseFare} ${multipliers.length ? '+ ' + multipliers.join(' + ') : ''}`;
    
    document.getElementById('fareCard').style.display = 'block';
}

// Check fare function
function checkFare() {
    const from = document.getElementById('fromLocation').value;
    const to = document.getElementById('toLocation').value;

    if (!from || !to) {
        showAlert('Please select both pickup and destination locations', 'warning');
        return;
    }

    calculateEstimate();
    showAlert('✅ Fare calculated! Prices shown are dynamic and may change based on demand.', 'success');
    
    // Scroll to fare card
    document.getElementById('fareCard').scrollIntoView({ behavior: 'smooth' });
}

// Find autos function
function findAutos() {
    const from = document.getElementById('fromLocation').value;
    const to = document.getElementById('toLocation').value;

    if (!from || !to) {
        showAlert('Please select both pickup and destination locations', 'warning');
        return;
    }

    showAlert('🔍 Searching for available autos...', 'info');
    
    setTimeout(() => {
        displayAvailableAutos();
        const autosContainer = document.getElementById('autosContainer');
        autosContainer.style.display = 'block';
        
        // Update count
        const availableCount = availableAutosData.filter(auto => auto.available).length;
        document.getElementById('foundAutosCount').textContent = availableCount;
        
        showAlert(`✅ Found ${availableCount} autos for your route! Select one to book.`, 'success');
        
        // Scroll to results
        autosContainer.scrollIntoView({ behavior: 'smooth' });
    }, 2000);
}

// Display available autos
function displayAvailableAutos() {
    const container = document.getElementById('autosList');
    container.innerHTML = '';
    
    const availableAutos = availableAutosData.filter(auto => auto.available)
        .sort((a, b) => a.distance - b.distance);

    availableAutos.forEach(auto => {
        const autoCard = document.createElement('div');
        autoCard.className = 'auto-card';
        autoCard.innerHTML = `
            <div class="auto-header">
                <div class="driver-name">${auto.driverName}</div>
                <div class="rating">⭐ ${auto.rating}</div>
            </div>
            <div class="auto-details">
                <div class="detail-item">📍 ${auto.location}</div>
                <div class="detail-item">🚗 ${auto.autoNumber}</div>
                <div class="detail-item">📏 ${auto.distance} km away</div>
                <div class="detail-item">⏱ ETA: ${auto.eta} min</div>
                <div class="detail-item">📞 ${auto.phone}</div>
                <div class="detail-item">🎯 ${getCurrentDemandLevel()} demand</div>
            </div>
            <div class="fare-display">
                <div class="fare-amount">₹${auto.fare}</div>
                <div class="fare-note">Fare may vary based on route & time</div>
            </div>
            <button class="book-btn" onclick="bookAuto(${auto.id})">
                📍 Book This Auto
            </button>
        `;
        container.appendChild(autoCard);
    });
}

// Book an auto
function bookAuto(autoId) {
    const auto = availableAutosData.find(a => a.id === autoId);
    if (!auto) return;

    // Mark auto as unavailable
    auto.available = false;
    
    activeBooking = {
        autoId: autoId,
        driverName: auto.driverName,
        autoNumber: auto.autoNumber,
        phone: auto.phone,
        fare: auto.fare,
        eta: auto.eta,
        startTime: Date.now(),
        status: 'confirmed'
    };

    // Update tracking panel
    document.getElementById('driverName').textContent = auto.driverName;
    document.getElementById('autoNumber').textContent = auto.autoNumber;
    document.getElementById('etaTime').textContent = auto.eta + ' min';
    document.getElementById('driverPhone').textContent = auto.phone;

    // Show tracking panel
    document.getElementById('trackingPanel').classList.add('tracking-active');

    showAlert(`🎉 Booking confirmed! ${auto.driverName} is coming to pick you up.`, 'success');

    // Update counts
    updateAutoCount();
    updateStats();

    // Hide autos container
    document.getElementById('autosContainer').style.display = 'none';

    // Start tracking simulation
    startTracking();
}

// Start live tracking
function startTracking() {
    let progress = 0;
    const totalTime = activeBooking.eta * 60; // Convert to seconds

    trackingInterval = setInterval(() => {
        progress += 10; // Update every 10 seconds
        const progressPercent = Math.min((progress / totalTime) * 100, 100);

        document.getElementById('progressBar').style.width = progressPercent + '%';

        const remainingMinutes = Math.max(0, Math.ceil((totalTime - progress) / 60));
        document.getElementById('etaTime').textContent = 
            remainingMinutes > 0 ? remainingMinutes + ' min' : 'Arrived!';

        if (progressPercent >= 100) {
            clearInterval(trackingInterval);
            showAlert('🎯 Your auto has arrived! Have a safe journey.', 'success');
        }
    }, 10000);
}

// Cancel ride
function cancelRide() {
    if (activeBooking) {
        // Make auto available again
        const auto = availableAutosData.find(a => a.id === activeBooking.autoId);
        if (auto) auto.available = true;

        activeBooking = null;
        clearInterval(trackingInterval);
        
        document.getElementById('trackingPanel').classList.remove('tracking-active');
        showAlert('❌ Ride cancelled successfully. No charges applied.', 'info');
        
        updateAutoCount();
        updateStats();
    }
}

// Call driver
function callDriver() {
    if (activeBooking) {
        showAlert(`📞 Calling ${activeBooking.driverName} at ${activeBooking.phone}...`, 'info');
        // In real app, this would initiate a phone call
    }
}

// Update auto count display
function updateAutoCount() {
    const availableCount = availableAutosData.filter(auto => auto.available).length;
    const autoCountEl = document.getElementById('autoCount');
    if (autoCountEl) autoCountEl.textContent = availableCount;
    const availableAutosEl = document.getElementById('availableAutos');
    if (availableAutosEl) availableAutosEl.textContent = availableCount;
}

// Update live statistics
function updateStats() {
    const availableCount = availableAutosData.filter(auto => auto.available).length;
    const activeRides = availableAutosData.filter(auto => !auto.available).length;
    
    const availableAutosEl = document.getElementById('availableAutos');
    if (availableAutosEl) availableAutosEl.textContent = availableCount;
    
    const activeRidesEl = document.getElementById('activeRides');
    if (activeRidesEl) activeRidesEl.textContent = activeRides;
    
    const waitingStudentsEl = document.getElementById('waitingStudents');
    if (waitingStudentsEl) waitingStudentsEl.textContent = Math.floor(Math.random() * 30) + 15;
    
    const totalDriversEl = document.getElementById('totalDrivers');
    if (totalDriversEl) totalDriversEl.textContent = availableAutosData.length;
}

// Update live map with markers
function updateLiveMap() {
    const mapContainer = document.getElementById('mapContainer');
    mapContainer.innerHTML = '';

    // Add auto markers
    availableAutosData.forEach((auto, index) => {
        if (auto.available) {
            const marker = document.createElement('div');
            marker.className = 'marker auto-marker';
            marker.textContent = `🚗 ${auto.driverName.split(' ')[0]}`;
            marker.title = `${auto.driverName} - ${auto.location}`;
            
            // Random positions for demo
            const positions = [
                { left: '15%', top: '20%' },
                { left: '30%', top: '60%' },
                { left: '60%', top: '30%' },
                { left: '80%', top: '70%' },
                { left: '25%', top: '80%' },
                { left: '75%', top: '15%' }
            ];
            
            const pos = positions[index % positions.length];
            marker.style.left = pos.left;
            marker.style.top = pos.top;
            
            mapContainer.appendChild(marker);
        }
    });

    // Add student marker
    const studentMarker = document.createElement('div');
    studentMarker.className = 'marker student-marker';
    studentMarker.textContent = '👤 You';
    studentMarker.style.left = '45%';
    studentMarker.style.top = '45%';
    mapContainer.appendChild(studentMarker);
}

// Get current demand level
function getCurrentDemandLevel() {
    const availableCount = availableAutosData.filter(auto => auto.available).length;
    if (availableCount < 3) return 'High';
    if (availableCount < 6) return 'Medium';
    return 'Low';
}

// Driver goes online
function goOnline() {
    const driverName = document.getElementById('driverNameInput').value;
    const autoNumber = document.getElementById('autoNumberInput').value;
    const phone = document.getElementById('driverPhoneInput').value;

    if (!driverName || !autoNumber || !phone) {
        showAlert('Please fill in all driver details', 'warning');
        return;
    }

    const newDriver = {
        id: availableAutosData.length + 1,
        driverName: driverName,
        autoNumber: autoNumber,
        phone: phone,
        rating: (4.0 + Math.random()).toFixed(1),
        location: 'MBU Campus',
        distance: 0.2,
        eta: 1,
        fare: 350 + Math.floor(Math.random() * 50),
        available: true,
        lat: 13.6288,
        lng: 79.4192
    };

    availableAutosData.push(newDriver);
    showAlert(`✅ Welcome ${driverName}! You are now online and visible to students.`, 'success');
    
    updateAutoCount();
    updateStats();
    updateLiveMap();
}

// Handle custom time selection
function handleCustomTime() {
    const when = document.getElementById('whenTravel').value;
    const customGroup = document.getElementById('customTimeGroup');
    
    if (when === 'custom') {
        customGroup.style.display = 'block';
        setCurrentTime();
    } else {
        customGroup.style.display = 'none';
    }
    calculateEstimate();
}

// Set current time for datetime input
function setCurrentTime() {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    const customTime = document.getElementById('customTime');
    if (customTime) {
        customTime.value = now.toISOString().slice(0, 16);
    }
}

// Show alert messages
function showAlert(message, type) {
    const alertId = `${type}Alert`;
    const alert = document.getElementById(alertId);
    if (alert) {
        alert.textContent = message;
        alert.style.display = 'block';
        
        setTimeout(() => {
            alert.style.display = 'none';
        }, 5000);
    }
}

// Simulate real-time updates
function simulateRealTimeUpdates() {
    setInterval(() => {
        // Randomly change auto availability
        if (Math.random() > 0.8) {
            const randomAuto = availableAutosData[Math.floor(Math.random() * availableAutosData.length)];
            if (randomAuto && (!activeBooking || randomAuto.id !== activeBooking?.autoId)) {
                randomAuto.available = !randomAuto.available;
            }
        }
        
        updateAutoCount();
        updateStats();
        updateLiveMap();
    }, 15000); // Update every 15 seconds
}

// Emergency help function
function emergencyHelp() {
    showAlert('🆘 Emergency services contacted. Help is on the way!', 'info');
}

// Admin functions
function updatePricing() {
    const baseMultiplier = document.getElementById('baseFareMultiplier').value;
    const peakMultiplier = document.getElementById('peakHourMultiplier').value;
    
    document.getElementById('baseFareValue').textContent = baseMultiplier + 'x';
    document.getElementById('peakHourValue').textContent = peakMultiplier + 'x';
    
    // Update pricing in real-time
    Object.keys(routePricing).forEach(route => {
        routePricing[route].baseFare *= parseFloat(baseMultiplier);
    });
    
    calculateEstimate();
    showAlert('✅ Pricing updated successfully!', 'success');
}

function exportData() {
    showAlert('📊 Analytics data exported successfully!', 'success');
}

// Add event listeners
document.addEventListener('DOMContentLoaded', function() {
    initApp();
    
    // Add change event listeners
    const whenTravelEl = document.getElementById('whenTravel');
    if (whenTravelEl) whenTravelEl.addEventListener('change', handleCustomTime);
    
    const fromLocationEl = document.getElementById('fromLocation');
    if (fromLocationEl) fromLocationEl.addEventListener('change', calculateEstimate);
    
    const toLocationEl = document.getElementById('toLocation');
    if (toLocationEl) toLocationEl.addEventListener('change', calculateEstimate);
    
    const passengersEl = document.getElementById('passengers');
    if (passengersEl) passengersEl.addEventListener('change', calculateEstimate);
});

// Socket.io live-tracking integration (client)
if (typeof firebase !== 'undefined') {
  firebase.auth().onAuthStateChanged(async (user) => {
    if (!user) return;
    const token = await user.getIdToken();
    const socket = io('/', { auth: { token } });
    socket.on('connect', () => console.log('Live socket connected', socket.id));
    socket.on('vehicle:location', (data) => {
      console.log('Live update', data);
      const etaEl = document.getElementById('etaTime');
      if (etaEl) etaEl.textContent = 'Live coords: ' + data.lat.toFixed(4) + ', ' + data.lng.toFixed(4);
    });
  });
}
