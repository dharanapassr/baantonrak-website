import React from 'react';
import { Award, Book, Briefcase, CheckCircle, ChevronRight, Clock, Edit, FileText, Home, Layers, LogOut, Menu, Moon, PlusCircle, Settings, Star, Sun, Trash2, User, UserPlus, Users, Video, X, ListVideo, HelpCircle, Upload } from 'lucide-react';

// --- SUPABASE CLIENT SETUP ---
// IMPORTANT: For a real deployment, you would use Environment Variables.
// For this preview environment, replace the placeholder values below.
// You can find these in your Supabase project settings under "API".
const supabaseUrl = 'YOUR_SUPABASE_URL'; // Replace with your Supabase Project URL
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'; // Replace with your Supabase Anon Key

// --- MOCK DATA (For initial database seeding if needed, now handled in Supabase dashboard) ---
const mockTestimonials = [
    { name: "สมชาย", role: "นักเรียน", quote: "คอร์สนี้เปลี่ยนมุมมองการใช้ชีวิตของผมไปเลยครับ! เนื้อหาเข้าใจง่ายและนำไปใช้ได้จริง", avatar: "https://placehold.co/100x100/e2e8f0/475569?text=ส" },
    { name: "จินตนา", role: "เจ้าของธุรกิจ", quote: "ได้เรียนรู้เทคนิคการบริหารทีมที่ยอดเยี่ยม ทำให้ธุรกิจของฉันเติบโตขึ้นมาก ขอบคุณโค้ชมากค่ะ", avatar: "https://placehold.co/100x100/e2e8f0/475569?text=จ" },
];


// --- CONTEXT for Auth, Theme, and Data ---
const AppContext = React.createContext();

const AppProvider = ({ children }) => {
    const [supabase, setSupabase] = React.useState(null);
    const [page, setPage] = React.useState({ name: 'home', params: {} });
    const [theme, setTheme] = React.useState('light');
    const [user, setUser] = React.useState(null); // Supabase auth user
    const [profile, setProfile] = React.useState(null); // User profile from 'profiles' table
    const [isAuthReady, setIsAuthReady] = React.useState(false);
    const [authError, setAuthError] = React.useState("");

    // --- DATA STATE ---
    const [courses, setCourses] = React.useState([]);
    const [users, setUsers] = React.useState([]); // Admin list of all user profiles
    const [pdfs, setPdfs] = React.useState([]);
    const [categories, setCategories] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    // Initialize Supabase Client
    React.useEffect(() => {
        const initializeSupabase = () => {
            if (window.supabase && window.supabase.createClient) {
                const { createClient } = window.supabase;
                setSupabase(createClient(supabaseUrl, supabaseAnonKey));
            } else {
                setTimeout(initializeSupabase, 50);
            }
        };
        initializeSupabase();
    }, []);

    // --- NAVIGATION ---
    const navigate = (pageName, params = {}) => {
        setAuthError("");
        setPage({ name: pageName, params });
        const paramString = new URLSearchParams(params).toString();
        window.location.hash = `${pageName}${paramString ? `?${paramString}` : ''}`;
        window.scrollTo(0, 0);
    };

    // --- AUTHENTICATION ---
    const login = async (email, password) => {
        if (!supabase) return;
        setAuthError("");
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            console.error("Login Error:", error.message);
            setAuthError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
        }
    };

    const register = async (email, password, fullName) => {
        if (!supabase) return;
        setAuthError("");
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName }
            }
        });
        if (error) {
            console.error("Registration Error:", error.message);
            if (error.message.includes("unique constraint")) {
                setAuthError("อีเมลนี้ถูกใช้งานแล้ว");
            } else {
                setAuthError("เกิดข้อผิดพลาดในการสมัครสมาชิก");
            }
        }
    };

    const logout = async () => {
        if (!supabase) return;
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        navigate('home');
    };

    // --- DATA FETCHING ---
    React.useEffect(() => {
        if (!supabase || supabaseUrl.includes('YOUR_SUPABASE_URL')) {
            setLoading(false);
            return;
        }

        const fetchInitialData = async () => {
            setLoading(true);
            try {
                const results = await Promise.all([
                    supabase.from('categories').select('*'),
                    supabase.from('courses').select('*'),
                    supabase.from('pdfs').select('*'),
                    supabase.from('profiles').select('*')
                ]);

                const [categoriesRes, coursesRes, pdfsRes, usersRes] = results;
                
                if (categoriesRes.error) throw categoriesRes.error;
                setCategories(categoriesRes.data);

                if (coursesRes.error) throw coursesRes.error;
                setCourses(coursesRes.data);

                if (pdfsRes.error) throw pdfsRes.error;
                setPdfs(pdfsRes.data);
                
                if (usersRes.error) throw usersRes.error;
                setUsers(usersRes.data);

            } catch (error) {
                console.error("Error fetching initial data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
        
        const subscriptions = [
            supabase.channel('public:categories').on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, fetchInitialData).subscribe(),
            supabase.channel('public:courses').on('postgres_changes', { event: '*', schema: 'public', table: 'courses' }, fetchInitialData).subscribe(),
            supabase.channel('public:pdfs').on('postgres_changes', { event: '*', schema: 'public', table: 'pdfs' }, fetchInitialData).subscribe(),
            supabase.channel('public:profiles').on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchInitialData).subscribe(),
        ];

        return () => {
            subscriptions.forEach(sub => supabase.removeChannel(sub));
        };

    }, [supabase]);


    // --- AUTH STATE LISTENER ---
    React.useEffect(() => {
        if (!supabase) {
            setIsAuthReady(true);
            return;
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const currentUser = session?.user;
            setUser(currentUser ?? null);

            if (currentUser) {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', currentUser.id)
                    .single();
                
                if (error) {
                    console.error("Error fetching profile:", error);
                    setProfile(null);
                } else {
                    setProfile(data);
                    if (_event === 'SIGNED_IN') {
                        navigate(data.role === 'admin' ? 'admin' : 'dashboard');
                    }
                }
            } else {
                setProfile(null);
            }
            setIsAuthReady(true);
        });

        return () => subscription.unsubscribe();
    }, [supabase]);
    
    // --- ROUTING LISTENER ---
    React.useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.replace('#', '');
            const [path, query] = hash.split('?');
            const params = new URLSearchParams(query);
            const pageParams = {};
            for (let param of params.entries()) {
                pageParams[param[0]] = param[1];
            }
            const protectedPages = ['dashboard', 'admin', 'pdf_download', 'learning'];
            if (!user && protectedPages.includes(path)) {
                 navigate('login');
            } else {
                 setPage({ name: path || 'home', params: pageParams });
            }
        };
        window.addEventListener('hashchange', handleHashChange);
        handleHashChange();
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, [isAuthReady, user]);

    // --- THEME ---
    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };
    React.useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
    }, [theme]);

    // --- CRUD Handlers (interact with Supabase) ---
    const crudHandlers = {
        addCourse: async (course) => {
            if (!supabase) return;
            const { error } = await supabase.from('courses').insert(course);
            if (error) console.error("Add Course Error:", error);
        },
        updateCourse: async (updatedCourse) => {
            if (!supabase) return;
            const { id, ...dataToUpdate } = updatedCourse;
            const { error } = await supabase.from('courses').update(dataToUpdate).eq('id', id);
            if (error) console.error("Update Course Error:", error);
        },
        deleteCourse: async (id) => {
            if (!supabase) return;
            const { error } = await supabase.from('courses').delete().eq('id', id);
            if (error) console.error("Delete Course Error:", error);
        },
        updateUser: async (updatedUser) => {
            if (!supabase) return;
             const { id, ...dataToUpdate } = updatedUser;
             const { error } = await supabase.from('profiles').update(dataToUpdate).eq('id', id);
             if (error) console.error("Update User Error:", error);
        },
        deleteUser: async (id) => {
            if (!supabase) return;
             const { error } = await supabase.from('profiles').delete().eq('id', id);
             if (error) console.error("Delete User Profile Error:", error);
        },
        addPdf: async (pdf) => {
            if (!supabase) return;
             const { error } = await supabase.from('pdfs').insert(pdf);
             if (error) console.error("Add PDF Error:", error);
        },
        updatePdf: async (updatedPdf) => {
            if (!supabase) return;
            const { id, ...dataToUpdate } = updatedPdf;
            const { error } = await supabase.from('pdfs').update(dataToUpdate).eq('id', id);
            if (error) console.error("Update PDF Error:", error);
        },
        deletePdf: async (id) => {
            if (!supabase) return;
            const { error } = await supabase.from('pdfs').delete().eq('id', id);
            if (error) console.error("Delete PDF Error:", error);
        },
        addCategory: async (category) => {
            if (!supabase) return;
            const { error } = await supabase.from('categories').insert({ name: category.name });
            if (error) console.error("Add Category Error:", error);
        },
        updateCategory: async (updatedCategory) => {
            if (!supabase) return;
            const { id, ...dataToUpdate } = updatedCategory;
            const { error } = await supabase.from('categories').update(dataToUpdate).eq('id', id);
            if (error) console.error("Update Category Error:", error);
        },
        deleteCategory: async (id) => {
            if (!supabase) return;
            const { error } = await supabase.from('categories').delete().eq('id', id);
            if (error) console.error("Delete Category Error:", error);
        },
    };

    const value = {
        user: profile,
        isAuthReady,
        login,
        register,
        logout,
        authError,
        page,
        navigate,
        theme,
        toggleTheme,
        courses,
        users,
        pdfs,
        categories,
        loading,
        ...crudHandlers
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

// --- UTILITY COMPONENTS ---
const PrimaryButton = ({ children, onClick, className = '', type = 'button', disabled = false }) => (
    <button type={type} onClick={onClick} disabled={disabled} className={`bg-[#0b6c87] text-white font-semibold py-2 px-5 rounded-md shadow-sm hover:bg-[#085368] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0b6c87] disabled:bg-gray-400 disabled:cursor-not-allowed ${className}`}>{children}</button>
);
const SecondaryButton = ({ children, onClick, className = '' }) => (
    <button onClick={onClick} className={`bg-white dark:bg-gray-700 text-[#0b6c87] font-semibold py-2 px-5 rounded-md border border-[#0b6c87] hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200 ${className}`}>{children}</button>
);
const Card = ({ children, className = '' }) => (
    <div className={`bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700/50 overflow-hidden transition-all duration-300 ${className}`}>{children}</div>
);
const InputField = ({ id, name, label, type, placeholder, value, onChange, required = false }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
        <input type={type} id={id} name={name} placeholder={placeholder} value={value} onChange={onChange} required={required} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-[#0b6c87] focus:border-[#0b6c87] dark:bg-gray-700 dark:text-white transition-colors" />
    </div>
);
const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700"><h3 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h3><button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={24} /></button></div>
                <div className="p-6 overflow-y-auto">{children}</div>
            </div>
        </div>
    );
};
const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-full p-10">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#0b6c87]"></div>
    </div>
);


// --- LAYOUT COMPONENTS ---
const Header = () => {
    const { user, navigate, logout, theme, toggleTheme } = React.useContext(AppContext);
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    
    const navLinks = [
        { name: 'หน้าแรก', page: 'home' },
        { name: 'คอร์สออนไลน์', page: 'courses' },
        { name: 'ดาวน์โหลด PDF', page: 'pdf_download' },
        { name: 'ติดต่อเรา', page: 'contact' },
    ];
    if (user?.role === 'admin') navLinks.push({ name: 'Admin', page: 'admin' });

    return (
        <header className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm sticky top-0 z-40 border-b border-gray-200 dark:border-gray-800">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex-shrink-0">
                        <a onClick={() => navigate('home')} className="flex items-center space-x-2 cursor-pointer">
                            <Book className="h-7 w-7 text-[#0b6c87]" />
                            <span className="text-xl font-bold text-gray-800 dark:text-white">Baantonrak</span>
                        </a>
                    </div>
                    <nav className="hidden md:flex md:items-center md:space-x-6">
                        {navLinks.map(link => (
                            <a key={link.page} onClick={() => navigate(link.page)} className="text-gray-600 dark:text-gray-300 hover:text-[#0b6c87] dark:hover:text-[#0b6c87] font-medium cursor-pointer transition-colors text-sm">{link.name}</a>
                        ))}
                    </nav>
                    <div className="flex items-center space-x-3">
                        <button onClick={toggleTheme} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                            {theme === 'light' ? <Moon size={18}/> : <Sun size={18}/>}
                        </button>
                        {user ? (
                            <div className="hidden md:flex items-center space-x-3">
                                <PrimaryButton onClick={() => navigate(user.role === 'admin' ? 'admin' : 'dashboard')} className="py-1.5 px-4 text-sm">แดชบอร์ด</PrimaryButton>
                                <button onClick={logout} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-red-500"><LogOut size={18} /></button>
                            </div>
                        ) : (
                            <div className="hidden md:flex items-center space-x-2">
                                <button onClick={() => navigate('login')} className="text-gray-600 dark:text-gray-300 font-medium px-4 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-sm">เข้าสู่ระบบ</button>
                                <PrimaryButton onClick={() => navigate('register')} className="py-1.5 px-4 text-sm">สมัครสมาชิก</PrimaryButton>
                            </div>
                        )}
                        <div className="md:hidden">
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-600 dark:text-gray-300">
                                {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {isMenuOpen && (
                <div className="md:hidden bg-white dark:bg-gray-900 pb-4 border-t dark:border-gray-800">
                    <nav className="flex flex-col items-center space-y-3 pt-3">
                        {navLinks.map(link => (
                            <a key={link.page} onClick={() => { navigate(link.page); setIsMenuOpen(false); }} className="text-gray-600 dark:text-gray-300 hover:text-[#0b6c87] font-medium cursor-pointer w-full text-center py-2">{link.name}</a>
                        ))}
                        <div className="pt-3 border-t border-gray-200 dark:border-gray-700 w-full flex flex-col items-center space-y-3">
                            {user ? (
                                <>
                                    <PrimaryButton onClick={() => { navigate(user.role === 'admin' ? 'admin' : 'dashboard'); setIsMenuOpen(false); }} className="w-4/5 text-center">แดชบอร์ด</PrimaryButton>
                                    <button onClick={() => { logout(); setIsMenuOpen(false); }} className="text-red-500 font-medium w-4/5 text-center py-2">ออกจากระบบ</button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => { navigate('login'); setIsMenuOpen(false); }} className="font-medium px-4 py-2 rounded-lg w-4/5 text-center hover:bg-gray-100 dark:hover:bg-gray-800">เข้าสู่ระบบ</button>
                                    <PrimaryButton onClick={() => { navigate('register'); setIsMenuOpen(false); }} className="w-4/5 text-center">สมัครสมาชิก</PrimaryButton>
                                </>
                            )}
                        </div>
                    </nav>
                </div>
            )}
        </header>
    );
};

const Footer = () => {
    const { navigate } = React.useContext(AppContext);
    return (
        <footer className="bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-800">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
                    <div className="col-span-2 md:col-span-1">
                        <a onClick={() => navigate('home')} className="flex items-center space-x-2 cursor-pointer">
                            <Book className="h-7 w-7 text-[#0b6c87]" />
                            <span className="text-lg font-bold text-gray-800 dark:text-white">Baantonrak</span>
                        </a>
                        <p className="mt-3 text-gray-500 dark:text-gray-400">แพลตฟอร์มเรียนรู้ออนไลน์เพื่อการเติบโต</p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-800 dark:text-white">เมนูหลัก</h3>
                        <ul className="mt-3 space-y-2">
                            <li><a onClick={() => navigate('home')} className="text-gray-500 dark:text-gray-400 hover:text-[#0b6c87] cursor-pointer">หน้าแรก</a></li>
                            <li><a onClick={() => navigate('courses')} className="text-gray-500 dark:text-gray-400 hover:text-[#0b6c87] cursor-pointer">คอร์สออนไลน์</a></li>
                            <li><a onClick={() => navigate('pdf_download')} className="text-gray-500 dark:text-gray-400 hover:text-[#0b6c87] cursor-pointer">ดาวน์โหลด PDF</a></li>
                            <li><a onClick={() => navigate('contact')} className="text-gray-500 dark:text-gray-400 hover:text-[#0b6c87] cursor-pointer">ติดต่อเรา</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-800 dark:text-white">ช่วยเหลือ</h3>
                        <ul className="mt-3 space-y-2">
                            <li><a href="#" className="text-gray-500 dark:text-gray-400 hover:text-[#0b6c87]">คำถามที่พบบ่อย</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-800 dark:text-white">ติดตามเรา</h3>
                        <div className="mt-3 flex">
                            <input type="email" placeholder="อีเมลของคุณ" className="w-full text-sm px-3 py-1.5 border border-gray-300 rounded-l-md focus:outline-none dark:bg-gray-800 dark:border-gray-600" />
                            <button className="bg-[#0b6c87] text-white px-3 rounded-r-md hover:bg-[#085368]">{'>'}</button>
                        </div>
                    </div>
                </div>
                <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6 text-center text-xs text-gray-500 dark:text-gray-400">
                    © {new Date().getFullYear()} Baantonrak.com. All rights reserved.
                </div>
            </div>
        </footer>
    );
};

const HomePage = () => {
    const { navigate } = React.useContext(AppContext);
    const TestimonialCard = ({ testimonial }) => (
        <Card className="p-6">
            <p className="text-gray-600 dark:text-gray-300">"{testimonial.quote}"</p>
            <div className="flex items-center space-x-3 mt-4">
                <img src={testimonial.avatar} alt={testimonial.name} className="w-10 h-10 rounded-full" />
                <div>
                    <p className="font-semibold text-sm text-gray-800 dark:text-white">{testimonial.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{testimonial.role}</p>
                </div>
            </div>
        </Card>
    );
    const ServiceCard = ({ icon, title, description, actionText, action }) => (
        <Card className="flex flex-col p-6 text-center items-center hover:shadow-lg hover:-translate-y-1 transition-all">
            <div className="bg-[#0b6c87]/10 text-[#0b6c87] rounded-full p-4 mb-4">{icon}</div>
            <h3 className="text-lg font-bold mb-2">{title}</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm flex-grow">{description}</p>
            <button onClick={action} className="mt-4 font-semibold text-[#0b6c87] text-sm flex items-center group">
                {actionText} <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform"/>
            </button>
        </Card>
    );
    return (
        <div className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
            <section className="relative bg-gray-50 dark:bg-gray-800/50">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="text-center md:text-left">
                            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white tracking-tight">ชุมชนบ้านต้นรัก</h1>
                            <p className="mt-4 text-md sm:text-lg text-gray-600 dark:text-gray-300">ชุมชนคนชอบเรียนรู้ เพื่อขยายรายได้อย่างไร้ขีดจำกัด</p>
                            <div className="mt-8 flex gap-4 justify-center md:justify-start">
                                <PrimaryButton onClick={() => navigate('courses')} className="text-base">ดูคอร์สทั้งหมด</PrimaryButton>
                                <SecondaryButton onClick={() => navigate('contact')} className="text-base">ปรึกษาเบื้องต้น</SecondaryButton>
                            </div>
                        </div>
                        <div className="flex justify-center">
                            <img 
                                src="https://storage.googleapis.com/gemini-generative-ai-docs/images/Gemini_Generated_Image_p1q5pyp1q5pyp1q5.jpg" 
                                onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/400x400/ffffff/000000?text=Logo'; }} 
                                alt="Logo ชุมชนบ้านต้นรัก" 
                                className="w-64 h-64 sm:w-80 sm:h-80 object-contain" 
                            />
                        </div>
                    </div>
                </div>
            </section>
            <section className="py-16 sm:py-20">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold">บริการของเรา</h2>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">เลือกเส้นทางการเติบโตที่เหมาะกับคุณ</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <ServiceCard icon={<Video size={28} />} title="คอร์สออนไลน์" description="เรียนรู้ทักษะใหม่ๆ ได้ทุกที่ ทุกเวลา ผ่านคอร์สคุณภาพที่ออกแบบมาอย่างดี" actionText="เลือกดูคอร์ส" action={() => navigate('courses')} />
                        <ServiceCard icon={<FileText size={28} />} title="ดาวน์โหลด PDF" description="เอกสารประกอบการเรียนรู้และเครื่องมือช่วยทำการตลาดดิจิทัล" actionText="ดาวน์โหลดเลย" action={() => navigate('pdf_download')} />
                        <ServiceCard icon={<Briefcase size={28} />} title="ปรึกษาธุรกิจ" description="รับคำปรึกษาเชิงลึกเพื่อวิเคราะห์และวางแผนกลยุทธ์ให้ธุรกิจของคุณ" actionText="นัดเวลาปรึกษา" action={() => navigate('contact')} />
                    </div>
                </div>
            </section>
            <section className="bg-gray-50 dark:bg-gray-800/50 py-16 sm:py-20">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-center mb-10">เสียงจากผู้ที่ร่วมเดินทางกับเรา</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {mockTestimonials.map((testimonial, index) => <TestimonialCard key={index} testimonial={testimonial} />)}
                    </div>
                </div>
            </section>
        </div>
    );
};

const CoursesPage = () => {
    const { courses, categories, navigate, loading } = React.useContext(AppContext);
    const CourseListItem = ({ course }) => {
        const levelColors = {
            'ฟรี': 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300',
            'Star': 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
            'VIP': 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
        };
        return (
            <Card className="p-4 flex flex-col sm:flex-row items-center gap-4 hover:shadow-md transition-shadow">
                <img src={course.thumbnail_url} alt={course.title} className="w-36 h-20 sm:w-40 sm:h-24 object-cover rounded-md flex-shrink-0" />
                <div className="flex-grow text-center sm:text-left">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${levelColors[course.access_level]}`}>{course.access_level}</span>
                    <h3 className="mt-2 text-md font-bold text-gray-800 dark:text-white">{course.title}</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{course.description}</p>
                    <div className="mt-2 flex items-center justify-center sm:justify-start gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1"><Layers size={14}/> {course.difficulty}</span>
                        <span className="flex items-center gap-1"><Clock size={14}/> {course.course_duration}</span>
                    </div>
                </div>
                <div className="flex-shrink-0 flex sm:flex-col items-center gap-2 mt-4 sm:mt-0">
                    <PrimaryButton onClick={() => navigate('learning', { courseId: course.id })} className="py-1.5 px-4 text-sm w-full">เข้าเรียน</PrimaryButton>
                </div>
            </Card>
        );
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
            <section className="py-16 sm:py-20">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-bold text-center mb-10">คอร์สเรียนออนไลน์</h1>
                    <div className="max-w-4xl mx-auto space-y-8">
                        {categories.sort((a,b) => a.id - b.id).map(category => {
                            const filteredCourses = courses.filter(c => c.category_id === category.id);
                            if (filteredCourses.length === 0) return null;
                            return (
                                <div key={category.id}>
                                    <h2 className="text-xl font-bold mb-4">{category.name}</h2>
                                    <div className="space-y-6">
                                        {filteredCourses.map(course => <CourseListItem key={course.id} course={course} />)}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>
        </div>
    );
};

const AuthPageLayout = ({ title, children, error }) => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm text-center">
            <Book className="mx-auto h-10 w-auto text-[#0b6c87]" />
            <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
        </div>
        <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-sm">
            <Card className="px-6 py-8 sm:px-10">
                {error && <p className="mb-4 text-center text-sm text-red-600 bg-red-100 dark:bg-red-900/30 p-2 rounded-md">{error}</p>}
                {children}
            </Card>
        </div>
    </div>
);

const LoginPage = () => {
    const { login, navigate, authError } = React.useContext(AppContext);
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');

    const handleLogin = (e) => {
        e.preventDefault();
        login(email, password);
    };
    return (
        <AuthPageLayout title="เข้าสู่ระบบ" error={authError}>
            <form className="space-y-6" onSubmit={handleLogin}>
                <InputField id="email" label="อีเมล" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <InputField id="password" label="รหัสผ่าน" type="password" placeholder="รหัสผ่านของคุณ" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <div><PrimaryButton type="submit" className="w-full">เข้าสู่ระบบ</PrimaryButton></div>
            </form>
            <div className="mt-6">
                <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                    ยังไม่มีบัญชี?{' '}
                    <a onClick={() => navigate('register')} className="font-medium text-[#0b6c87] hover:text-[#085368] cursor-pointer">สมัครสมาชิก</a>
                </p>
            </div>
        </AuthPageLayout>
    );
};

const RegisterPage = () => {
    const { register, navigate, authError } = React.useContext(AppContext);
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [fullName, setFullName] = React.useState('');
    
    const handleRegister = (e) => {
        e.preventDefault();
        register(email, password, fullName);
    };
    return (
        <AuthPageLayout title="สร้างบัญชีใหม่" error={authError}>
            <form className="space-y-6" onSubmit={handleRegister}>
                <InputField id="fullname" name="fullname" label="ชื่อ-นามสกุล" type="text" placeholder="ชื่อเต็มของคุณ" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                <InputField id="email" name="email" label="อีเมล" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <InputField id="password" name="password" label="รหัสผ่าน" type="password" placeholder="สร้างรหัสผ่าน (อย่างน้อย 6 ตัวอักษร)" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <div><PrimaryButton type="submit" className="w-full">สมัครสมาชิก</PrimaryButton></div>
            </form>
            <div className="mt-6">
                <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                    มีบัญชีอยู่แล้ว?{' '}
                    <a onClick={() => navigate('login')} className="font-medium text-[#0b6c87] hover:text-[#085368] cursor-pointer">เข้าสู่ระบบ</a>
                </p>
            </div>
        </AuthPageLayout>
    );
};

// --- MAIN APP COMPONENT ---
export default function App() {
    return (
        <AppProvider>
            <MainContent />
        </AppProvider>
    );
}

const MainContent = () => {
    const { page, isAuthReady, navigate, user, logout, theme, toggleTheme, courses, categories, loading, authError, login, register } = React.useContext(AppContext);

    const renderPage = () => {
        switch (page.name) {
            case 'home': return <HomePage />;
            case 'courses': return <CoursesPage />;
            case 'login': return <LoginPage />;
            case 'register': return <RegisterPage />;
            // Add other pages here
            // case 'dashboard': return <DashboardPage />;
            // case 'admin': return <AdminDashboardPage />;
            default: return <HomePage />;
        }
    };

    const isAuthPage = page.name === 'login' || page.name === 'register';
    const isFullScreenPage = isAuthPage;
    
    if (!isAuthReady) {
        return (
             <div className="font-sarabun antialiased flex flex-col min-h-screen bg-white dark:bg-gray-900">
                <div className="flex-grow flex items-center justify-center">
                    <LoadingSpinner />
                </div>
            </div>
        )
    }

    return (
        <div className="font-sarabun antialiased flex flex-col min-h-screen bg-white dark:bg-gray-900">
            {!isFullScreenPage && <Header />}
            <main className="flex-grow">
                {renderPage()}
            </main>
            {!isFullScreenPage && <Footer />}
        </div>
    );
}
