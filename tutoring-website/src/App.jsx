import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, where, onSnapshot, doc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { Calendar, Book, Mail, User, Phone, X, ChevronLeft, ChevronRight, Package, Lock, LogOut } from 'lucide-react';

// --- Firebase Configuration ---
// This configuration is provided by the environment.
const firebaseConfig = {
    apiKey: "AIzaSyAFNSrqURuNYsEJcvNZU1dhe9ia73Kye-Q",
    authDomain: "aryan-tutoring-webiste.firebaseapp.com",
    projectId: "aryan-tutoring-webiste",
    storageBucket: "aryan-tutoring-webiste.firebasestorage.app",
    messagingSenderId: "1012511465817",
    appId: "1:1012511465817:web:21f31ca9d20ab00c0e2c48",
    measurementId: "G-XRFBQQBEKC"
  };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- App ID for Firestore Path ---
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-tutoring-app';

// --- Main App Component ---
export default function App() {
    const [user, setUser] = useState(null);
    const [view, setView] = useState('home'); // 'home' or 'admin'
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
            } else {
                signInAnonymously(auth).catch(error => console.error("Anonymous sign-in failed:", error));
            }
        });
        return () => unsubscribe();
    }, []);

    const handleAdminLogin = () => {
        const password = prompt("Please enter the admin password:");
        // In a real app, this should be a secure authentication method.
        if (password === "tutor123") {
            setIsAdmin(true);
            setView('admin');
        } else {
            alert("Incorrect password.");
        }
    };
    
    const handleLogout = () => {
        setIsAdmin(false);
        setView('home');
    };

    if (!user) {
        return <div className="flex items-center justify-center min-h-screen bg-gray-50"><div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-blue-600"></div></div>;
    }

    if (view === 'admin') {
        return <AdminPanel onLogout={handleLogout} />;
    }

    return <HomePage onAdminLogin={handleAdminLogin} />;
}

// --- Home Page Component ---
function HomePage({ onAdminLogin }) {
    const services = [
        { id: 'chem1-2', name: 'Chemistry 1 & 2', courseCodes: 'CHM2045/46', description: 'Grasp core concepts of general chemistry, from stoichiometry to acid-base reactions.', icon: Book },
        { id: 'bio1-2', name: 'Biology 1 & 2', courseCodes: 'BSC2010/11', description: 'Explore the fundamentals of cellular biology, genetics, and ecosystems.', icon: Book },
        { id: 'orgo1-2', name: 'Organic Chemistry 1 & 2', courseCodes: 'CHM2210/11', description: 'Master reaction mechanisms, synthesis, and spectroscopy in organic chemistry.', icon: Book },
        { id: 'biochem', name: 'Biochemistry', courseCodes: 'BCH4024', description: 'Delve into the molecular basis of life, focusing on proteins, enzymes, and metabolism.', icon: Book },
        { id: 'calc1', name: 'Calculus 1', courseCodes: 'MAC2311', description: 'Build a strong foundation in limits, derivatives, and integrals.', icon: Book },
    ];
    const packages = [
        { name: 'Starter Pack', sessions: 5, description: 'Five 60-minute sessions. Perfect for tackling a specific topic.', icon: Package },
        { name: 'Semester Boost', sessions: 10, description: 'Ten 60-minute sessions. Ideal for consistent, weekly support.', icon: Package },
    ];
    const [selectedService, setSelectedService] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleBookNow = (service) => {
        setSelectedService(service);
        setIsModalOpen(true);
    };
    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedService(null);
    };

    return (
        <div 
            className="min-h-screen font-sans text-gray-800 bg-cover bg-center bg-fixed"
            style={{ backgroundImage: "url('https://www.publicdomainpictures.net/pictures/320000/velka/scientific-formula-background.jpg')" }}
        >
            <div className="min-h-screen bg-white/90 backdrop-blur-sm">
                <div className="container mx-auto px-4 py-12">
                    <header className="text-center mb-16">
                        <h1 className="text-5xl font-bold text-gray-900">Aryan Patel Tutoring</h1>
                        <p className="text-xl text-gray-700 mt-2">Expert guidance in Math and Science to help you excel.</p>
                    </header>
                    <main>
                        <section id="services">
                            <h2 className="text-3xl font-bold text-center mb-10">Book a Session</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                                {services.map(service => <ServiceCard key={service.id} service={service} onBookNow={handleBookNow} />)}
                            </div>
                        </section>
                        <section id="packages" className="mt-20">
                            <h2 className="text-3xl font-bold text-center mb-10">Session Packages</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                                {packages.map(pkg => <PackageCard key={pkg.name} pkg={pkg} />)}
                            </div>
                        </section>
                        <section id="contact" className="mt-20 max-w-2xl mx-auto">
                            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
                                <h2 className="text-3xl font-bold text-center mb-2">Need Something Else?</h2>
                                <p className="text-center text-gray-600 mb-6">Contact me for classes not listed, group sessions, or any other questions.</p>
                                <ContactForm />
                            </div>
                        </section>
                    </main>
                    <footer className="text-center mt-16">
                        <button onClick={onAdminLogin} className="text-sm text-gray-500 hover:text-blue-600 transition-colors">Admin</button>
                    </footer>
                </div>
            </div>
            {isModalOpen && <BookingModal service={selectedService} onClose={closeModal} />}
        </div>
    );
}


// --- Admin Panel Component ---
function AdminPanel({ onLogout }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [availability, setAvailability] = useState([]);
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('17:00');

    const formattedSelectedDate = selectedDate.toISOString().split('T')[0];

    // Fetch availability for the selected date
    useEffect(() => {
        const availDocRef = doc(db, `artifacts/${appId}/public/data/availability`, formattedSelectedDate);
        const unsubscribe = onSnapshot(availDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setAvailability(docSnap.data().slots || []);
            } else {
                setAvailability([]);
            }
        });
        return () => unsubscribe();
    }, [selectedDate]);

    const handleAddAvailability = async () => {
        const newSlots = [];
        let currentTime = new Date(`${formattedSelectedDate}T${startTime}`);
        const endDateTime = new Date(`${formattedSelectedDate}T${endTime}`);

        while (currentTime < endDateTime) {
            newSlots.push(currentTime.toTimeString().substring(0, 5));
            currentTime.setMinutes(currentTime.getMinutes() + 30);
        }

        const uniqueSlots = [...new Set([...availability, ...newSlots])].sort();
        const availDocRef = doc(db, `artifacts/${appId}/public/data/availability`, formattedSelectedDate);
        await setDoc(availDocRef, { slots: uniqueSlots });
    };
    
    const handleRemoveSlot = async (slotToRemove) => {
        const updatedSlots = availability.filter(slot => slot !== slotToRemove);
        const availDocRef = doc(db, `artifacts/${appId}/public/data/availability`, formattedSelectedDate);
        await setDoc(availDocRef, { slots: updatedSlots });
    };

    // Calendar logic
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const monthName = currentDate.toLocaleString('default', { month: 'long' });
    const year = currentDate.getFullYear();
    const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const handleDateClick = (day) => setSelectedDate(new Date(year, currentDate.getMonth(), day));

    return (
        <div className="bg-gray-100 min-h-screen p-8">
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold">Admin Panel</h1>
                <button onClick={onLogout} className="flex items-center gap-2 bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600">
                    <LogOut size={20} /> Logout
                </button>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Calendar */}
                <div className="md:col-span-1 bg-white p-6 rounded-lg shadow-md">
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-100"><ChevronLeft /></button>
                        <h4 className="font-bold text-lg">{monthName} {year}</h4>
                        <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-100"><ChevronRight /></button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-sm">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d} className="font-medium text-gray-500">{d}</div>)}
                        {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`}></div>)}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const date = new Date(year, currentDate.getMonth(), day);
                            const isSelected = selectedDate?.toDateString() === date.toDateString();
                            return (
                                <button key={day} onClick={() => handleDateClick(day)} className={`w-10 h-10 rounded-full transition-colors ${isSelected ? 'bg-blue-600 text-white' : 'hover:bg-blue-100'}`}>
                                    {day}
                                </button>
                            );
                        })}
                    </div>
                </div>
                {/* Availability Management */}
                <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold mb-4">Manage Availability for {selectedDate.toLocaleDateString()}</h2>
                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                        <h3 className="font-bold mb-2">Add Time Block</h3>
                        <div className="flex items-center gap-4">
                            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="p-2 border rounded-md"/>
                            <span>to</span>
                            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="p-2 border rounded-md"/>
                            <button onClick={handleAddAvailability} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700">Add</button>
                        </div>
                    </div>
                    <div>
                        <h3 className="font-bold mb-2">Available Slots</h3>
                        {availability.length > 0 ? (
                            <div className="grid grid-cols-4 gap-2">
                                {availability.map(slot => (
                                    <div key={slot} className="flex items-center justify-between bg-green-100 text-green-800 p-2 rounded-md">
                                        <span>{slot}</span>
                                        <button onClick={() => handleRemoveSlot(slot)}><X size={16} className="text-red-500 hover:text-red-700"/></button>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-gray-500">No availability set for this day.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}


// --- All other components (Cards, Modal, Form) ---

function ServiceCard({ service, onBookNow }) {
    const Icon = service.icon;
    return (
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-gray-200 flex flex-col transition-transform hover:scale-105 duration-300">
            <div className="flex-grow">
                <Icon className="w-10 h-10 text-blue-600 mb-4" />
                <h3 className="text-2xl font-bold">{service.name}</h3>
                <p className="text-sm text-gray-500 mb-2 font-mono">{service.courseCodes}</p>
                <p className="text-gray-600 mb-4">{service.description}</p>
            </div>
            <div className="flex items-center justify-between mt-4">
                <span className="text-lg font-semibold text-gray-700">From 60 mins</span>
                <button onClick={() => onBookNow(service)} className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-300 shadow-md">Book Now</button>
            </div>
        </div>
    );
}

function PackageCard({ pkg }) {
    const Icon = pkg.icon;
    return (
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-gray-200 flex flex-col">
            <Icon className="w-10 h-10 text-green-600 mb-4" />
            <h3 className="text-2xl font-bold mb-2">{pkg.name}</h3>
            <p className="text-gray-600 mb-4 flex-grow">{pkg.description}</p>
            <a href="#contact" className="mt-4 bg-green-600 text-white text-center font-bold py-2 px-6 rounded-lg hover:bg-green-700 transition-colors duration-300 shadow-md">Inquire Now</a>
        </div>
    );
}

function BookingModal({ service, onClose }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState(null);
    const [selectedDuration, setSelectedDuration] = useState(60);
    const [bookedSlots, setBookedSlots] = useState([]);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [step, setStep] = useState(1);
    const [clientDetails, setClientDetails] = useState({ name: '', email: '', phone: '' });
    const [isBooking, setIsBooking] = useState(false);
    const durationOptions = [60, 90, 120];

    // Fetch availability and bookings for the selected date
    useEffect(() => {
        if (!selectedDate) return;
        const formattedDate = selectedDate.toISOString().split('T')[0];

        // Fetch availability
        const availDocRef = doc(db, `artifacts/${appId}/public/data/availability`, formattedDate);
        const unsubAvailability = onSnapshot(availDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setAvailableSlots(docSnap.data().slots || []);
            } else {
                setAvailableSlots([]);
            }
        });

        // Fetch bookings
        const bookingsCol = collection(db, `artifacts/${appId}/public/data/bookings`);
        const q = query(bookingsCol, where("date", "==", formattedDate));
        const unsubBookings = onSnapshot(q, (snapshot) => {
            const slots = snapshot.docs.map(doc => doc.data().time);
            setBookedSlots(slots);
        });

        return () => {
            unsubAvailability();
            unsubBookings();
        };
    }, [selectedDate]);

    const finalTimeSlots = useMemo(() => {
        return availableSlots.filter(slot => !bookedSlots.includes(slot));
    }, [availableSlots, bookedSlots]);

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const monthName = currentDate.toLocaleString('default', { month: 'long' });
    const year = currentDate.getFullYear();
    const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const handleDateClick = (day) => {
        const today = new Date();
        today.setHours(0,0,0,0);
        const clickedDate = new Date(year, currentDate.getMonth(), day);
        if (clickedDate >= today) {
            setSelectedDate(clickedDate);
            setSelectedTime(null);
        }
    };
    
    const handleDetailChange = (e) => setClientDetails({ ...clientDetails, [e.target.name]: e.target.value });

    const handleConfirmBooking = async () => {
        if (!clientDetails.name || !clientDetails.email) {
            alert("Please fill in your name and email.");
            return;
        }
        setIsBooking(true);
        try {
            const bookingData = {
                serviceId: service.id,
                serviceName: service.name,
                date: selectedDate.toISOString().split('T')[0],
                time: selectedTime,
                duration: selectedDuration,
                clientName: clientDetails.name,
                clientEmail: clientDetails.email,
                clientPhone: clientDetails.phone,
                createdAt: new Date(),
            };
            const bookingsCol = collection(db, `artifacts/${appId}/public/data/bookings`);
            await addDoc(bookingsCol, bookingData);
            setStep(3);
        } catch (error) {
            console.error("Error adding document: ", error);
        } finally {
            setIsBooking(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <header className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900">{service.name}</h3>
                        <p className="text-gray-600">{selectedDuration} minute session</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 transition-colors"><X className="w-6 h-6 text-gray-600" /></button>
                </header>

                <div className="p-6 overflow-y-auto">
                    {step === 1 && (
                        <div>
                            <div className="mb-6">
                                <h4 className="font-bold text-lg mb-2 text-center">Select Session Length</h4>
                                <div className="flex justify-center items-center gap-3">
                                    {durationOptions.map(duration => (
                                        <button key={duration} onClick={() => setSelectedDuration(duration)} className={`py-2 px-6 rounded-lg font-semibold transition-all duration-200 ${selectedDuration === duration ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-blue-100'}`}>
                                            {duration} min
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-200 pt-6">
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-100"><ChevronLeft /></button>
                                        <h4 className="font-bold text-lg">{monthName} {year}</h4>
                                        <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-100"><ChevronRight /></button>
                                    </div>
                                    <div className="grid grid-cols-7 gap-1 text-center text-sm">
                                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d} className="font-medium text-gray-500">{d}</div>)}
                                        {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`}></div>)}
                                        {Array.from({ length: daysInMonth }).map((_, i) => {
                                            const day = i + 1;
                                            const date = new Date(year, currentDate.getMonth(), day);
                                            const isPast = date < new Date() && date.toDateString() !== new Date().toDateString();
                                            const isSelected = selectedDate?.toDateString() === date.toDateString();
                                            return <button key={day} disabled={isPast} onClick={() => handleDateClick(day)} className={`w-10 h-10 rounded-full transition-colors ${isSelected ? 'bg-blue-600 text-white' : isPast ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-blue-100'}`}>{day}</button>;
                                        })}
                                    </div>
                                </div>
                                <div className="max-h-80 overflow-y-auto">
                                    {!selectedDate ? <div className="flex items-center justify-center h-full text-gray-500">Select a date to see available times.</div> : (
                                        <div className="grid grid-cols-3 gap-2">
                                            {finalTimeSlots.length > 0 ? finalTimeSlots.map(time => (
                                                <button key={time} onClick={() => setSelectedTime(time)} className={`p-2 rounded-lg text-center font-semibold transition-colors ${selectedTime === time ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-blue-100'}`}>{time}</button>
                                            )) : <p className="col-span-3 text-center text-gray-500">No available slots for this day.</p>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    {step === 2 && (
                        <div>
                            <h4 className="text-xl font-bold mb-4">Enter Your Details</h4>
                            <div className="space-y-4">
                                <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" name="name" placeholder="Full Name" value={clientDetails.name} onChange={handleDetailChange} className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div>
                                <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="email" name="email" placeholder="Email Address" value={clientDetails.email} onChange={handleDetailChange} className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div>
                                <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="tel" name="phone" placeholder="Phone Number (Optional)" value={clientDetails.phone} onChange={handleDetailChange} className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div>
                            </div>
                        </div>
                    )}
                    {step === 3 && (
                        <div className="text-center py-10">
                            <div className="w-20 h-20 bg-green-100 rounded-full mx-auto flex items-center justify-center mb-4"><svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg></div>
                            <h4 className="text-2xl font-bold text-gray-900">Booking Confirmed!</h4>
                            <p className="text-gray-600 mt-2">Your <span className="font-semibold">{selectedDuration}-minute</span> session for <span className="font-semibold">{service.name}</span> on <span className="font-semibold">{selectedDate.toLocaleDateString()}</span> at <span className="font-semibold">{selectedTime}</span> is booked.</p>
                            <p className="mt-2">A confirmation email has been sent to <span className="font-semibold">{clientDetails.email}</span>.</p>
                            <button onClick={onClose} className="mt-6 bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors">Close</button>
                        </div>
                    )}
                </div>

                {step < 3 && (
                    <footer className="p-6 border-t border-gray-200 mt-auto">
                        {step === 1 && <div className="flex justify-between items-center"><div><p className="font-bold">{selectedDate ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'No date selected'}</p><p className="text-gray-600">{selectedTime || 'No time selected'}</p></div><button onClick={() => setStep(2)} disabled={!selectedDate || !selectedTime} className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md">Next</button></div>}
                        {step === 2 && <div className="flex justify-between items-center"><button onClick={() => setStep(1)} className="text-gray-600 font-bold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors">Back</button><button onClick={handleConfirmBooking} disabled={!clientDetails.name || !clientDetails.email || isBooking} className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md">{isBooking ? 'Booking...' : 'Confirm Booking'}</button></div>}
                    </footer>
                )}
            </div>
        </div>
    );
}

function ContactForm() {
    const [status, setStatus] = useState('idle');
    const handleSubmit = (e) => {
        e.preventDefault();
        setStatus('sending');
        setTimeout(() => { setStatus('success'); }, 1500);
    };
    if (status === 'success') {
        return (
            <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full mx-auto flex items-center justify-center mb-3"><svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg></div>
                <h4 className="text-xl font-bold">Message Sent!</h4>
                <p className="text-gray-600">Thanks for reaching out. Aryan will get back to you shortly.</p>
            </div>
        );
    }
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="Your Name" required className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                <input type="email" placeholder="Your Email" required className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <textarea placeholder="Your Message..." required rows="4" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"></textarea>
            <button type="submit" disabled={status === 'sending'} className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400">{status === 'sending' ? 'Sending...' : 'Send Message'}</button>
        </form>
    );
}