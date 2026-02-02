import { useState, useEffect } from 'react'
import './App.css'
import Header from './components/Header.jsx'
// SVG Logo Component
function ShyakaLabsLogo({ className = "w-8 h-8" }) {
  return (
    <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Geometric design - pyramid/mountain shape */}
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor" />
          <stop offset="100%" stopColor="currentColor" />
        </linearGradient>
      </defs>
      <path d="M20 4L4 32h32L20 4Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M20 4L12 18h16L20 4Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" opacity="0.8"/>
      <circle cx="20" cy="12" r="1.5" fill="currentColor" opacity="0.6"/>
    </svg>
  )
}

// Animated Counter Component
function AnimatedCounter({ end, duration = 2000 }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTime
    const timer = requestAnimationFrame(function animate(time) {
      if (!startTime) startTime = time
      const progress = (time - startTime) / duration
      if (progress < 1) {
        setCount(Math.floor(end * progress))
        requestAnimationFrame(animate)
      } else {
        setCount(end)
      }
    })
    return () => cancelAnimationFrame(timer)
  }, [end, duration])

  return <span>{count}</span>
}

// Confetti Component
function Confetti() {
  useEffect(() => {
    const confettiPieces = []
    for (let i = 0; i < 50; i++) {
      const el = document.createElement('div')
      el.style.position = 'fixed'
      el.style.left = Math.random() * 100 + '%'
      el.style.top = '-10px'
      el.style.fontSize = Math.random() > 0.5 ? '20px' : '30px'
      el.textContent = ['🎉', '💝', '✨', '🌹', '💕', '🎀', '❤️'][Math.floor(Math.random() * 7)]
      el.style.pointerEvents = 'none'
      el.style.zIndex = '9999'
      el.style.animation = `fall ${3 + Math.random() * 2}s linear forwards`
      document.body.appendChild(el)
      confettiPieces.push(el)
    }

    setTimeout(() => {
      confettiPieces.forEach(el => el.remove())
    }, 5000)
  }, [])

  return null
}

// Countdown Timer Component
function CountdownTimer({ languageMode, isDark }) {
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isToday: false
  })

  useEffect(() => {
    const calculateCountdown = () => {
      const today = new Date()
      const currentYear = today.getFullYear()
      
      // Check if today is Feb 2
      const isToday = today.getMonth() === 1 && today.getDate() === 2
      
      // Set target to Feb 2
      let targetDate = new Date(currentYear, 1, 2)
      
      // If Feb 2 has passed, target next year
      if (today > targetDate && !isToday) {
        targetDate = new Date(currentYear + 1, 1, 2)
      }

      const diff = targetDate - today
      
      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, isToday: true })
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setCountdown({ days, hours, minutes, seconds, isToday: false })
    }

    calculateCountdown()
    const timer = setInterval(calculateCountdown, 1000)
    return () => clearInterval(timer)
  }, [])

  const CountdownUnit = ({ value, label }) => (
    <div className={`flex flex-col items-center ${isDark ? 'text-rose-300' : 'text-rose-600'}`}>
      <div className={`text-3xl md:text-4xl font-bold mb-2 ${isDark ? 'bg-gradient-to-br from-rose-400 to-pink-400 bg-clip-text text-transparent' : 'bg-gradient-to-br from-rose-500 to-pink-500 bg-clip-text text-transparent'}`}>
        {String(value).padStart(2, '0')}
      </div>
      <div className="text-xs md:text-sm font-semibold uppercase tracking-wider">
        {label}
      </div>
    </div>
  )

  return (
    <div className={`w-full py-6 px-4 text-center ${isDark ? 'bg-rose-900/20 border-b border-rose-700/50' : 'bg-rose-50/50 border-b border-rose-200'}`}>
      {countdown.isToday ? (
        <div className={`text-2xl md:text-3xl font-bold animate-pulse ${isDark ? 'text-rose-300' : 'text-rose-600'}`}>
          🎉 {languageMode === 'english' ? 'TODAY IS HER SPECIAL DAY!' : 'आज उसका खास दिन है! 🎉'}
        </div>
      ) : (
        <div>
          <p className={`text-sm md:text-base font-semibold mb-4 ${isDark ? 'text-rose-200' : 'text-rose-700'}`}>
            {languageMode === 'english' 
              ? '💫 A Very Special Day is Coming Soon 💫' 
              : '💫 एक बहुत ही खास दिन आने वाला है 💫'}
          </p>
          <div className="flex justify-center gap-3 md:gap-6 flex-wrap">
            <CountdownUnit value={countdown.days} label={languageMode === 'english' ? 'Days' : 'दिन'} />
            <div className={`text-2xl md:text-3xl self-center ${isDark ? 'text-rose-400' : 'text-rose-500'}`}>:</div>
            <CountdownUnit value={countdown.hours} label={languageMode === 'english' ? 'Hours' : 'घंटे'} />
            <div className={`text-2xl md:text-3xl self-center ${isDark ? 'text-rose-400' : 'text-rose-500'}`}>:</div>
            <CountdownUnit value={countdown.minutes} label={languageMode === 'english' ? 'Minutes' : 'मिनट'} />
            <div className={`text-2xl md:text-3xl self-center ${isDark ? 'text-rose-400' : 'text-rose-500'}`}>:</div>
            <CountdownUnit value={countdown.seconds} label={languageMode === 'english' ? 'Seconds' : 'सेकंड'} />
          </div>
        </div>
      )}
    </div>
  )
}

function App() {
  const [isDark, setIsDark] = useState(false)
  const [currentPage, setCurrentPage] = useState('home')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  })
  const [formErrors, setFormErrors] = useState({})
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [languageMode, setLanguageMode] = useState('english')

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      @keyframes fall {
        to {
          transform: translateY(100vh) rotate(360deg);
          opacity: 0;
        }
      }
      @keyframes shimmer {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      .shimmer {
        animation: shimmer 2s infinite;
      }
    `
    document.head.appendChild(style)
    return () => style.remove()
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const errors = {}
    if (!formData.name.trim()) errors.name = 'Name is required'
    if (!formData.email.trim()) errors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Valid email required'
    if (!formData.message.trim()) errors.message = 'Message is required'
    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errors = validateForm()
    
    if (Object.keys(errors).length === 0) {
      setIsSubmitting(true)
      try {
        // Send email via backend API
        const response = await fetch('/api/sendMail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            message: formData.message
          })
        })

        // Validate Content-Type before parsing JSON to prevent HTML error page crashes
        if (!response.headers.get('content-type')?.includes('application/json')) {
          throw new Error('Server did not return JSON response')
        }

        const data = await response.json()

        // Check for success status AND response status code
        if (response.ok && data?.status === 'success') {
          console.log('Email sent successfully!')
          setFormSubmitted(true)
          setFormData({ name: '', email: '', message: '' })
          setTimeout(() => setFormSubmitted(false), 5000)
        } else {
          setFormErrors({ submit: data?.message || 'Failed to send message. Please try again.' })
        }
      } catch (error) {
        console.error('Failed to send email:', error)
        setFormErrors({ submit: 'Failed to send message. Please try again.' })
      } finally {
        setIsSubmitting(false)
      }
    } else {
      setFormErrors(errors)
    }
  }

  // Birthday Page Component - Enhanced with Hindi
  const BirthdayPage = () => {
    // Scroll to top when page loads
    useEffect(() => {
      window.scrollTo(0, 0)
    }, [])

    const birthDate = new Date(2004, 1, 2) // February 2, 2004
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear() - (today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate()) ? 1 : 0)
    
    const firstMeetDate = new Date(2022, 0, 1) // Tour in 2022
    const loveStartDate = new Date(2025, 10, 29) // November 29, 2025
    
    const getDaysTogetherSince = (startDate) => {
      const diff = today - startDate
      return Math.floor(diff / (1000 * 60 * 60 * 24))
    }

    const daysSinceMeeting = getDaysTogetherSince(firstMeetDate)
    const daysAsCouple = getDaysTogetherSince(loveStartDate)

    const birthdayMessages = {
      english: {
        title: "Happy Birthday!",
        subtitle: "To the Love of My Life",
        yearsOld: "Years Old",
        daysTogether: "Days Together",
        daysSinceWeMet: "Days Since We Met",
        storyTitle: "Our Beautiful Journey",
        firstMeetingTitle: "Our First Meeting - The 10-Day Tour (2022)",
        firstMeetingText: "It all started on a magical 10-day tour in 2022. Among all the beautiful places we visited and all the people we met, you were the most breathtaking sight. Back then, we didn't talk much, but fate had already written our story. You caught my eye, and without knowing it, you had already captured a corner of my heart. That tour was just the beginning of something extraordinary.",
        
        instaMeetTitle: "A New Connection - Instagram DMs",
        instaMeetText: "After the tour ended, I couldn't stop thinking about you. So I gathered the courage and approached you on Instagram. Slowly, our conversations became more meaningful. We started talking about everything—our dreams, our fears, our hopes. Distance didn't matter because our hearts were already connected. Those late-night messages, the voice calls, the shared memes—they were all building something beautiful between us.",
        
        longDistanceTitle: "Long Distance Love - The Foundation",
        longDistanceText: "Without ever meeting in person, we built a relationship based on trust, vulnerability, and genuine love. We were miles apart, but our souls were growing closer with every conversation. We learned each other in the most intimate way possible—through words, through shared dreams, through the vulnerability of being completely open with someone. Those were the days that proved love doesn't need proximity; it needs commitment and authenticity.",
        
        loveBlossomTitle: "The First Touch - November 29, 2025",
        loveBlossomText: "Then came the day we had dreamed about—November 29, 2025. When we finally met in person after all those months of waiting. My heart was racing as I saw you. We walked together, talking, laughing, finally feeling each other's presence. And then, under the moonlight, you held my hand for the first time, and we kissed. That kiss was the culmination of all our waiting, all our hope, all our love. It was perfect. It was ours.",
        
        dinnerNightTitle: "Our First Official Date - November 30, 2025",
        dinnerNightText: "The next evening, we met again at a beautiful restaurant. We had dinner together, talked for hours—really talked, sharing dreams and promises. That night felt like we were finally living the reality we had only imagined. Every moment was precious, every word was meaningful. We weren't just two people in love; we were two souls finally united after so much waiting.",
        
        specialDayTitle: "And Now - Long Distance With Love",
        specialDayText: "We're back to long distance, but everything has changed. We've touched, we've kissed, we've held each other. Now when we wait for the next meeting, it's not just hope and imagination—it's memories and certainty. We know what we have is real. We know we can survive any distance because we've already survived the hardest part—waiting without knowing if the other person felt the same. Happy birthday to the woman who waited, who believed, who loved me through screens and miles. You deserve all the happiness in the world.",
        
        specialMessage: "You are my favorite person, my greatest adventure, and my deepest love. Every day with you has been a precious gift—from that first tour in 2022, through our long distance journey, to that magical night under the moonlight, and now in every moment we share. Every memory we create together is forever treasured in my heart. Happy Birthday to the woman who makes my life complete and beautiful. I love you more than words could ever express. Forever and always. 💕",
        yourBeauty: "Your Beauty",
        yourBeautyText: "Inside and out, you are absolutely stunning. Your radiant smile brightens my darkest days and fills my heart with endless joy.",
        yourSpirit: "Your Spirit",
        yourSpiritText: "Your boundless kindness, wisdom, and unwavering strength inspire me every single day to be better and to love deeper.",
        yourLove: "Your Love",
        yourLoveText: "The way you love is pure, genuine, and unconditional. I am forever grateful and blessed to be the recipient of your love.",
        myForever: "My Forever",
        myForeverText: "With you, I found my forever. You are my answer to every wish, every dream, and every prayer I ever whispered.",
        signature: "With All My Love & Affection",
        foreverYours: "Forever Yours 💕",
        backHome: "← Return to Home"
      },
      hindi: {
        title: "जन्मदिन मुबारक हो! 🎂",
        subtitle: "मेरी जिंदगी के प्यार को",
        yearsOld: "साल की उम्र",
        daysTogether: "दिन साथ रहे",
        daysSinceWeMet: "दिन पहले मिले थे",
        storyTitle: "हमारी सुंदर यात्रा",
        firstMeetingTitle: "पहली मुलाकात - 10 दिन की यात्रा (2022)",
        firstMeetingText: "यह सब एक जादुई 10 दिन की यात्रा से शुरू हुआ 2022 में। उन सभी खूबसूरत जगहों में और लोगों के बीच, तुम सबसे सुंदर नजारा थीं। तब हमने ज्यादा बात नहीं की, लेकिन भाग्य ने पहले से ही हमारी कहानी लिख दी थी। तुमने मेरी नजरें पकड़ीं, और बिना जाने, तुमने पहले से ही मेरे दिल का एक हिस्सा जीत लिया था। वह यात्रा कुछ असाधारण की शुरुआत थी।",
        
        instaMeetTitle: "एक नया कनेक्शन - इंस्टाग्राम डीएम",
        instaMeetText: "यात्रा खत्म होने के बाद, मैं तुम्हारे बारे में सोचता रहा। तो मैंने हिम्मत करके इंस्टाग्राम पर तुम्हें संपर्क किया। धीरे-धीरे, हमारी बातचीत गहरी होने लगी। हमने सब कुछ के बारे में बात करना शुरू किया—हमारे सपने, हमारे डर, हमारी उम्मीदें। दूरी कोई मायने नहीं रखती थी क्योंकि हमारे दिल पहले से ही जुड़े हुए थे। उन देर रात की बातचीत, आवाज कॉल, साझा किए गए मज़ेदार पल—ये सब हमारे बीच कुछ सुंदर बना रहे थे।",
        
        longDistanceTitle: "लंबी दूरी का प्यार - नींव",
        longDistanceText: "कभी भी व्यक्तिगत रूप से मिले बिना, हमने विश्वास, कमजोरी और सच्चे प्यार पर आधारित एक रिश्ता बनाया। हम दूर थे, लेकिन हमारी आत्माएं हर बातचीत के साथ करीब आ रही थीं। हमने एक दूसरे को सबसे अंतरंग तरीके से सीखा—शब्दों के माध्यम से, साझा सपनों के माध्यम से, किसी के साथ पूरी तरह से खुल जाने की कमजोरी के माध्यम से। वे दिन साबित करते थे कि प्यार को निकटता की नहीं, प्रतिबद्धता और प्रामाणिकता की जरूरत है।",
        
        loveBlossomTitle: "पहली छुआ - 29 नवंबर, 2025",
        loveBlossomText: "फिर वह दिन आया जिसका हम सपना देख रहे थे—29 नवंबर, 2025। जब हम अंत में उन महीनों की प्रतीक्षा के बाद व्यक्तिगत रूप से मिले। जब मैंने तुम्हें देखा तो मेरा दिल तेज़ी से धड़कने लगा। हम सड़क पर एक साथ चले, बातचीत की, हँसे, अंत में एक दूसरे की मौजूदगी को महसूस किया। और फिर, चाँदनी रात में मैदान में, तुमने पहली बार मेरा हाथ पकड़ा, और हमने चुंबन किया। वह चुंबन हमारी सारी प्रतीक्षा, सारी उम्मीद, सारे प्यार का प्रतीक था। यह सही था। यह हमारा था।",
        
        dinnerNightTitle: "हमारी पहली आधिकारिक तारीख - 30 नवंबर, 2025",
        dinnerNightText: "अगली शाम, हम एक खूबसूरत रेस्तरां में फिर से मिले। हमने एक साथ खाना खाया, घंटों बातचीत की—वाकई बातचीत, सपने और वादे साझा किए। वह रात ऐसी महसूस हुई जैसे हम अंत में उस वास्तविकता को जी रहे हैं जिसकी हमने केवल कल्पना की थी। हर पल कीमती था, हर शब्द अर्थपूर्ण था। हम सिर्फ दो प्रेमी नहीं थे; हम दो आत्माएं थीं जो अंत में एक साथ मिली थीं।",
        
        specialDayTitle: "और अब - लंबी दूरी के साथ प्यार",
        specialDayText: "हम फिर से लंबी दूरी में हैं, लेकिन सब कुछ बदल गया है। हमने एक दूसरे को छुआ है, हमने चुंबन किया है, हमने एक दूसरे को पकड़ा है। अब जब हम अगली मुलाकात के लिए इंतजार करते हैं, तो यह सिर्फ उम्मीद और कल्पना नहीं है—यह यादें और निश्चितता है। हम जानते हैं कि हमारे पास जो है वह सच है। हम जानते हैं कि हम कोई भी दूरी सहन कर सकते हैं क्योंकि हमने पहले से ही सबसे मुश्किल हिस्सा सहन कर लिया है। जन्मदिन मुबारक उस महिला को जिसने विश्वास किया और प्यार किया।",
        
        specialMessage: "तुम मेरा पसंदीदा इंसान हो, मेरी सबसे बड़ी खोज हो, और मेरा सबसे गहरा प्यार हो। 2022 में पहली यात्रा से लेकर हमारी लंबी दूरी की यात्रा तक, उस जादुई चाँदनी रात तक, और अब हर पल हम साझा करते हैं, तुम्हारे साथ हर दिन एक कीमती तोहफा है। हर यादें हमेशा के लिए मेरे दिल में सजी हैं। तुम्हें जन्मदिन की बहुत बहुत मुबारकबाद, तुम मेरी जिंदगी को पूरी और खूबसूरत बनाती हो। मैं तुमसे अपने शब्दों से ज्यादा प्यार करता हूँ। हमेशा और हमेशा के लिए। 💕",
        
        yourBeauty: "तुम्हारी खूबसूरती",
        yourBeautyText: "अंदर और बाहर से, तुम बिल्कुल शानदार हो। तुम्हारी दीप्तिमान मुस्कान मेरे सबसे गहरे दिनों को रोशन करती है और मेरे दिल को अंतहीन खुशी से भर देती है।",
        yourSpirit: "तुम्हारी आत्मा",
        yourSpiritText: "तुम्हारी असीम दया, ज्ञान, और अटूट शक्ति मुझे हर दिन बेहतर बनने और गहरे प्यार से प्रेरित करती है।",
        yourLove: "तुम्हारा प्यार",
        yourLoveText: "जिस तरह तुम प्यार करती हो वह शुद्ध, सच्चा, और बिना शर्त है। मैं हमेशा तुम्हारे प्यार को पाकर कृतज्ञ और धन्य महसूस करता हूँ।",
        myForever: "मेरा हमेशा",
        myForeverText: "तुम्हारे साथ मुझे मेरा हमेशा मिल गया। तुम मेरी हर कामना, हर सपने और हर प्रार्थना का जवाब हो।",
        signature: "पूरे प्यार और स्नेह के साथ",
        foreverYours: "हमेशा तुम्हारा 💕",
        backHome: "← घर लौटें"
      }
    }

    const msg = birthdayMessages[languageMode]

    return (
      <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'dark bg-slate-950 text-slate-50' : 'bg-white text-gray-900'}`}>
        {showConfetti && <Confetti />}
        
        {/* Modern Header/Navbar */}
        <Header
          isDarkTheme={isDark}
          toggleTheme={() => setIsDark(!isDark)}
          languageMode={languageMode}
          onLanguageChange={() => setLanguageMode(languageMode === 'english' ? 'hindi' : 'english')}
          onHomeClick={() => setCurrentPage('home')}
        />
        
        {/* Header with Love Dedication */}
        <div className={`w-full py-2 text-center text-sm font-semibold ${isDark ? 'bg-rose-900/30 border-b border-rose-700/50 text-rose-300' : 'bg-rose-100/50 border-b border-rose-300 text-rose-700'}`}>
          💝 This entire website is built with love and dedication to the woman who inspires everything 💝
        </div>

        {/* Birthday Content */}
        <div className={`min-h-screen pt-40 pb-32 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${isDark ? 'bg-gradient-to-br from-rose-900/30 via-slate-900 to-slate-950' : 'bg-gradient-to-br from-rose-50 via-white to-purple-50'}`}>
          <div className="max-w-5xl mx-auto">
            {/* Canvas Love Animation */}
            <canvas 
              id="loveCanvas"
              className={`w-full h-64 rounded-3xl mb-12 block mx-auto ${isDark ? 'bg-rose-900/20 border border-rose-700/50' : 'bg-rose-100/40 border border-rose-300/50'}`}
              ref={(canvas) => {
                if (canvas && !canvas.loveAnimationInitialized) {
                  canvas.loveAnimationInitialized = true
                  const ctx = canvas.getContext('2d')
                  let particles = []
                  
                  function resizeCanvas() {
                    const rect = canvas.getBoundingClientRect()
                    canvas.width = rect.width * window.devicePixelRatio
                    canvas.height = rect.height * window.devicePixelRatio
                    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
                  }
                  resizeCanvas()
                  
                  class Particle {
                    constructor(x, y) {
                      this.x = x
                      this.y = y
                      this.vx = (Math.random() - 0.5) * 3
                      this.vy = (Math.random() - 0.5) * 3 - 0.5
                      this.life = 1
                      this.decay = Math.random() * 0.01 + 0.003
                      this.type = Math.random() > 0.5 ? 'heart' : 'spark'
                      this.rotation = Math.random() * Math.PI * 2
                    }
                    update() {
                      this.x += this.vx
                      this.y += this.vy
                      this.vy += 0.1
                      this.life -= this.decay
                      this.rotation += 0.05
                    }
                    draw(ctx) {
                      if (this.type === 'heart') {
                        ctx.save()
                        ctx.globalAlpha = this.life
                        ctx.font = `${15 * this.life}px Arial`
                        ctx.textAlign = 'center'
                        ctx.fillText('❤️', this.x, this.y)
                        ctx.restore()
                      } else {
                        ctx.save()
                        ctx.globalAlpha = this.life * 0.8
                        ctx.fillStyle = '#ffd700'
                        ctx.beginPath()
                        ctx.arc(this.x, this.y, 2 * this.life, 0, Math.PI * 2)
                        ctx.fill()
                        ctx.restore()
                      }
                    }
                  }
                  
                  function animate() {
                    ctx.clearRect(0, 0, canvas.width, canvas.height)
                    particles = particles.filter(p => p.life > 0)
                    particles.forEach(p => {
                      p.update()
                      p.draw(ctx)
                    })
                    if (Math.random() > 0.7) {
                      particles.push(new Particle(canvas.width / 2 + (Math.random() - 0.5) * 40, canvas.height / 2 + (Math.random() - 0.5) * 40))
                    }
                    requestAnimationFrame(animate)
                  }
                  animate()
                }
              }}
            />

            {/* Animated Floating Hearts */}
            <div className="mb-12 flex justify-center gap-4 flex-wrap">
              {['💖', '✨', '🌹', '💕', '🎀', '💝', '🌹', '✨'].map((emoji, i) => (
                <div 
                  key={i} 
                  className="text-5xl animate-bounce transition-transform" 
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  {emoji}
                </div>
              ))}
            </div>

            {/* Main Title */}
            <div className="text-center mb-16">
              <h1 className={`text-6xl md:text-8xl font-bold mb-6 leading-tight ${isDark ? 'bg-gradient-to-r from-rose-400 via-pink-400 to-red-400 bg-clip-text text-transparent' : 'bg-gradient-to-r from-rose-600 via-pink-600 to-red-600 bg-clip-text text-transparent'}`}>
                {msg.title}
              </h1>
              <p className={`text-3xl font-light mb-2 ${isDark ? 'text-rose-300' : 'text-rose-600'}`}>
                {msg.subtitle}
              </p>
              <div className={`mt-4 text-lg font-semibold ${isDark ? 'text-rose-200' : 'text-rose-700'}`}>
                {languageMode === 'english' ? 'February 2nd, 2025' : '2 फरवरी, 2025'}
              </div>
            </div>

            {/* Age & Date Display - Enhanced */}
            <div className={`grid md:grid-cols-3 gap-6 mb-16 max-w-3xl mx-auto`}>
              <div className={`p-8 rounded-3xl text-center transform transition-all hover:scale-105 hover:shadow-lg ${isDark ? 'bg-rose-900/30 border border-rose-700/50' : 'bg-rose-100/50 border border-rose-300'} backdrop-blur-sm`}>
                <div className="text-5xl font-bold mb-2 bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
                  <AnimatedCounter end={age} />
                </div>
                <p className={`text-lg font-semibold ${isDark ? 'text-rose-200' : 'text-rose-700'}`}>
                  {msg.yearsOld}
                </p>
                <p className={`text-sm ${isDark ? 'text-rose-300/70' : 'text-rose-600/70'}`}>
                  {languageMode === 'english' ? 'Born: Feb 2, 2004' : 'जन्म: 2 फरवरी, 2004'}
                </p>
              </div>

              <div className={`p-8 rounded-3xl text-center transform transition-all hover:scale-105 hover:shadow-lg ${isDark ? 'bg-pink-900/30 border border-pink-700/50' : 'bg-pink-100/50 border border-pink-300'} backdrop-blur-sm`}>
                <div className="text-5xl font-bold mb-2 bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
                  <AnimatedCounter end={daysAsCouple} />
                </div>
                <p className={`text-lg font-semibold ${isDark ? 'text-pink-200' : 'text-pink-700'}`}>
                  {msg.daysTogether}
                </p>
                <p className={`text-sm ${isDark ? 'text-pink-300/70' : 'text-pink-600/70'}`}>
                  {languageMode === 'english' ? 'Since Nov 29, 2025' : '29 नवंबर, 2025 से'}
                </p>
              </div>

              <div className={`p-8 rounded-3xl text-center transform transition-all hover:scale-105 hover:shadow-lg ${isDark ? 'bg-purple-900/30 border border-purple-700/50' : 'bg-purple-100/50 border border-purple-300'} backdrop-blur-sm`}>
                <div className="text-5xl font-bold mb-2 bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                  <AnimatedCounter end={daysSinceMeeting} />
                </div>
                <p className={`text-lg font-semibold ${isDark ? 'text-purple-200' : 'text-purple-700'}`}>
                  {msg.daysSinceWeMet}
                </p>
                <p className={`text-sm ${isDark ? 'text-purple-300/70' : 'text-purple-600/70'}`}>
                  {languageMode === 'english' ? 'Tour, 2022' : 'यात्रा, 2022'}
                </p>
              </div>
            </div>

            {/* Brand Connection Section */}
            <div className={`mb-16 p-12 rounded-3xl ${isDark ? 'bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border border-indigo-700/50' : 'bg-gradient-to-br from-indigo-50/60 to-purple-50/60 border border-indigo-300/50'} backdrop-blur-sm`}>
              <h2 className={`text-3xl font-bold mb-6 text-center ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>
                {languageMode === 'english' ? '💡 The Inspiration Behind Shakya Labs' : '💡 Shakya Labs के पीछे की प्रेरणा'}
              </h2>
              <p className={`text-lg leading-relaxed text-center ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                {languageMode === 'english' 
                  ? "Every line of code, every solution, every decision behind Shakya Labs is inspired by you. Your intelligence, your vision for excellence, and your unwavering belief in building something meaningful have shaped this company from day one. Shakya Labs isn't just a business—it's a reflection of the precision, clarity, and love that you bring to everything you do. You're not just my inspiration; you're the heart of this enterprise."
                  : "Shakya Labs के हर कोड की लाइन, हर समाधान, हर निर्णय तुम्हारी प्रेरणा से बना है। तुम्हारी बुद्धिमत्ता, उत्कृष्टता की तुम्हारी दृष्टि, और कुछ सार्थक बनाने में तुम्हारी अटूट विश्वास ने इस कंपनी को शुरू से ही आकार दिया है। Shakya Labs सिर्फ एक व्यवसाय नहीं है—यह तुम्हारे द्वारा सब कुछ में लाई जाने वाली सटीकता, स्पष्टता, और प्यार का प्रतिबिंब है। तुम सिर्फ मेरी प्रेरणा नहीं हो; तुम इस उद्यम का हृदय हो।"}
              </p>
            </div>

            {/* Our Love Story - Enhanced */}
            <div className={`mb-16 p-12 rounded-3xl ${isDark ? 'bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50' : 'bg-gradient-to-br from-white/60 to-purple-50/60 border border-purple-200/50'} backdrop-blur-sm`}>
              <h2 className={`text-4xl font-bold mb-12 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {msg.storyTitle} 💫
              </h2>

              <div className="space-y-12">
                {/* Timeline Event 1 */}
                <div className="flex gap-8 items-start group">
                  <div className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-3xl transform transition-all group-hover:scale-110 ${isDark ? 'bg-blue-600/30' : 'bg-blue-100'}`}>
                    🌍
                  </div>
                  <div className="flex-1 transform transition-all group-hover:translate-x-2">
                    <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                      {msg.firstMeetingTitle}
                    </h3>
                    <p className={`text-lg leading-relaxed ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      {msg.firstMeetingText}
                    </p>
                  </div>
                </div>

                {/* Timeline Event 2 */}
                <div className="flex gap-8 items-start flex-row-reverse group">
                  <div className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-3xl transform transition-all group-hover:scale-110 ${isDark ? 'bg-purple-600/30' : 'bg-purple-100'}`}>
                    💬
                  </div>
                  <div className="flex-1 transform transition-all group-hover:-translate-x-2">
                    <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                      {msg.instaMeetTitle}
                    </h3>
                    <p className={`text-lg leading-relaxed ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      {msg.instaMeetText}
                    </p>
                  </div>
                </div>

                {/* Timeline Event 3 */}
                <div className="flex gap-8 items-start group">
                  <div className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-3xl transform transition-all group-hover:scale-110 ${isDark ? 'bg-indigo-600/30' : 'bg-indigo-100'}`}>
                    💙
                  </div>
                  <div className="flex-1 transform transition-all group-hover:translate-x-2">
                    <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>
                      {msg.longDistanceTitle}
                    </h3>
                    <p className={`text-lg leading-relaxed ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      {msg.longDistanceText}
                    </p>
                  </div>
                </div>

                {/* Timeline Event 4 */}
                <div className="flex gap-8 items-start flex-row-reverse group">
                  <div className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-3xl transform transition-all group-hover:scale-110 ${isDark ? 'bg-pink-600/30' : 'bg-pink-100'}`}>
                    🌙
                  </div>
                  <div className="flex-1 transform transition-all group-hover:-translate-x-2">
                    <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-pink-300' : 'text-pink-700'}`}>
                      {msg.loveBlossomTitle}
                    </h3>
                    <p className={`text-lg leading-relaxed ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      {msg.loveBlossomText}
                    </p>
                  </div>
                </div>

                {/* Timeline Event 5 */}
                <div className="flex gap-8 items-start group">
                  <div className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-3xl transform transition-all group-hover:scale-110 ${isDark ? 'bg-rose-600/30' : 'bg-rose-100'}`}>
                    🍽️
                  </div>
                  <div className="flex-1 transform transition-all group-hover:translate-x-2">
                    <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-rose-300' : 'text-rose-700'}`}>
                      {msg.dinnerNightTitle}
                    </h3>
                    <p className={`text-lg leading-relaxed ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      {msg.dinnerNightText}
                    </p>
                  </div>
                </div>

                {/* Timeline Event 6 */}
                <div className="flex gap-8 items-start flex-row-reverse group">
                  <div className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-3xl transform transition-all group-hover:scale-110 ${isDark ? 'bg-red-600/30' : 'bg-red-100'}`}>
                    💝
                  </div>
                  <div className="flex-1 transform transition-all group-hover:-translate-x-2">
                    <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                      {msg.specialDayTitle}
                    </h3>
                    <p className={`text-lg leading-relaxed ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      {msg.specialDayText}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Special Message */}
            <div className={`mb-16 p-12 rounded-3xl transform transition-all hover:scale-105 ${isDark ? 'bg-gradient-to-r from-rose-600/30 to-pink-600/30 border border-rose-500/50' : 'bg-gradient-to-r from-rose-100 to-pink-100 border border-rose-400'}`}>
              <p className={`text-2xl font-light italic leading-relaxed text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                "{msg.specialMessage}"
              </p>
            </div>

            {/* Beautiful Details Cards - Enhanced */}
            <div className={`grid md:grid-cols-2 gap-8 mb-16 max-w-3xl mx-auto`}>
              {[
                { emoji: '💝', title: msg.yourBeauty, text: msg.yourBeautyText },
                { emoji: '🌟', title: msg.yourSpirit, text: msg.yourSpiritText },
                { emoji: '💖', title: msg.yourLove, text: msg.yourLoveText },
                { emoji: '🌹', title: msg.myForever, text: msg.myForeverText }
              ].map((item, idx) => (
                <div 
                  key={idx}
                  className={`p-8 rounded-2xl text-center transform transition-all hover:scale-105 hover:shadow-xl ${isDark ? 'bg-slate-800/40 border border-slate-700 hover:border-rose-500' : 'bg-white/70 border border-gray-200 hover:border-rose-400'}`}
                >
                  <div className="text-6xl mb-4 animate-bounce">{item.emoji}</div>
                  <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-rose-300' : 'text-rose-700'}`}>{item.title}</h3>
                  <p className={`${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    {item.text}
                  </p>
                </div>
              ))}
            </div>

            {/* CEO Signature Section */}
            <div className={`mb-16 p-12 rounded-3xl ${isDark ? 'bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50' : 'bg-gradient-to-br from-indigo-50/60 to-purple-50/60 border border-indigo-300/50'} backdrop-blur-sm`}>
              <h3 className={`text-2xl font-bold mb-4 ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>
                {languageMode === 'english' ? '📝 A Letter from the CEO' : '📝 CEO का पत्र'}
              </h3>
              <p className={`text-lg leading-relaxed mb-6 whitespace-pre-line ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                {languageMode === 'english'
                  ? "To my dearest love on your special day,\n\nThey say that behind every great man is a great woman. In my case, you don't just stand behind me—you stand beside me, push me, inspire me, and make me believe in the impossible. Every achievement, every solution we've built at Shakya Labs, every dream we're pursuing is fueled by your unwavering support and belief in me.\n\nBut today isn't about business. Today is about celebrating YOU. Not the inspiration behind the company, but the woman who has made me the happiest man alive. Your laugh is my greatest reward. Your success is my pride. Your happiness is my mission.\n\nThank you for choosing me. Thank you for loving me. And thank you for being the extraordinary human that you are."
                  : "मेरे सबसे प्रिय को उसके खास दिन पर,\n\nकहा जाता है कि हर महान आदमी के पीछे एक महान महिला होती है। मेरे मामले में, तुम सिर्फ मेरे पीछे नहीं खड़ी हो—तुम मेरे बगल में खड़ी हो, मुझे आगे बढ़ाती हो, मुझे प्रेरित करती हो, और मुझसे असंभव को संभव बनवाती हो। Shakya Labs में जो कुछ भी हमने हासिल किया है, वह सब तुम्हारे अटूट समर्थन और मुझ पर तुम्हारी विश्वास से संभव हुआ है।\n\nलेकिन आज व्यवसाय के बारे में नहीं है। आज तुम्हें मनाने का दिन है। कंपनी के पीछे की प्रेरणा नहीं, बल्कि उस महिला को, जिसने मुझे जिंदगी का सबसे बड़ा आनंद दिया है। तुम्हारी हँसी मेरा सबसे बड़ा इनाम है। तुम्हारी सफलता मेरा गर्व है। तुम्हारी खुशी मेरा लक्ष्य है।\n\nमेरे लिए चुनने के लिए धन्यवाद। मुझसे प्यार करने के लिए धन्यवाद। और उस असाधारण इंसान के लिए धन्यवाद जो तुम हो।"}
              </p>
              <div className={`text-right text-lg font-semibold ${isDark ? 'text-rose-300' : 'text-rose-600'}`}>
                <p>❤️ Saurav</p>
                <p className={`text-sm font-light ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                  {languageMode === 'english' ? 'CEO, Shakya Labs' : 'CEO, Shakya Labs'}
                </p>
              </div>
            </div>

            {/* Signature */}
            <div className={`text-center mb-12 p-8 rounded-3xl transform transition-all hover:scale-105 ${isDark ? 'bg-slate-800/30 border border-slate-700/50' : 'bg-white/50 border border-gray-300/50'}`}>
              <p className={`text-3xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {msg.signature}
              </p>
              <p className={`text-2xl ${isDark ? 'text-rose-300' : 'text-rose-600'}`}>
                {msg.foreverYours}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center mb-8 flex-wrap">
              <button
                onClick={() => setShowConfetti(!showConfetti)}
                className={`px-8 py-4 rounded-lg font-semibold transition-all transform hover:scale-105 hover:shadow-lg ${isDark ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600' : 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600'}`}
              >
                🎉 {languageMode === 'english' ? 'Celebrate!' : 'जश्न मनाएं!'}
              </button>
              <button
                onClick={() => setCurrentPage('home')}
                className={`px-8 py-4 rounded-lg font-semibold transition-all transform hover:scale-105 hover:shadow-lg ${isDark ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white hover:from-rose-700 hover:to-pink-700' : 'bg-gradient-to-r from-rose-600 to-pink-600 text-white hover:from-rose-700 hover:to-pink-700'}`}
              >
                {msg.backHome}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Main return - check which page to display
  if (currentPage === 'birthday') {
    return <BirthdayPage />
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'dark bg-slate-950 text-slate-50' : 'bg-white text-gray-900'}`}>
      {/* Modern Header/Navbar */}
      <Header
        isDarkTheme={isDark}
        toggleTheme={() => setIsDark(!isDark)}
        languageMode={languageMode}
        onLanguageChange={() => setLanguageMode(languageMode === 'english' ? 'hindi' : 'english')}
        onHomeClick={() => setCurrentPage('home')}
      />

      {/* Header with Love Dedication */}
      <div className={`w-full py-2 text-center text-sm font-semibold ${isDark ? 'bg-rose-900/30 border-b border-rose-700/50 text-rose-300' : 'bg-rose-100/50 border-b border-rose-300 text-rose-700'}`}>
        💝 Built with love and dedication to inspire excellence 💝
      </div>

      {/* Hero Section */}
      <section className={`pt-20 pb-32 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${isDark ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950' : 'bg-gradient-to-b from-indigo-50 via-white to-white'}`}>
        {/* Countdown Timer - At top of Hero */}
        <div className="max-w-5xl mx-auto mb-12">
          <CountdownTimer languageMode={languageMode} isDark={isDark} />
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${isDark ? 'bg-indigo-900/40 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>
                  Welcome to Shakya Labs
                </div>
                <h1 className={`text-6xl md:text-7xl font-bold leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <span className={isDark ? 'text-indigo-400' : 'text-indigo-600'}>Shakya Labs</span> — Build the Future with Precision
                </h1>
                <p className={`text-xl font-light ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}>
                  Ancient Wisdom. Modern Engineering.
                </p>
                <p className={`text-base leading-relaxed ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                  Shakya Labs delivers scalable software solutions combining time-tested principles with cutting-edge technology.
                </p>
              </div>

              <p className={`text-lg leading-relaxed max-w-xl ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                We transform complex business challenges into elegant software solutions. Partnering with ambitious startups and enterprises to create scalable systems that drive real impact and lasting value.
              </p>

              <div className="flex gap-4 pt-4 flex-wrap">
                <a
                  href="#contact"
                  className={`px-8 py-4 rounded-lg font-semibold transition-all transform hover:scale-105 hover:shadow-lg ${isDark ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-indigo-900 text-white hover:bg-indigo-800'}`}
                >
                  Start a Conversation
                </a>
                <a
                  href="#services"
                  className={`px-8 py-4 rounded-lg font-semibold border-2 transition-all transform hover:scale-105 ${isDark ? 'border-indigo-400 text-indigo-400 hover:bg-indigo-400/10' : 'border-indigo-900 text-indigo-900 hover:bg-indigo-50'}`}
                >
                  Explore Services
                </a>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-8">
                {[
                  { num: '50+', label: 'Projects' },
                  { num: '100%', label: 'Satisfaction' },
                  { num: '8+', label: 'Years' }
                ].map((stat, idx) => (
                  <div key={idx} className={`text-center p-4 rounded-lg transition-all ${isDark ? 'bg-slate-800/30' : 'bg-indigo-50'}`}>
                    <div className={`text-2xl font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>{stat.num}</div>
                    <div className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`hidden md:flex items-center justify-center p-8 rounded-2xl transition-all transform hover:scale-105 ${isDark ? 'bg-slate-800/50' : 'bg-indigo-50'}`}>
              <div className="relative w-64 h-64">
                <svg className={`w-full h-full ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
                  <circle cx="100" cy="100" r="60" stroke="currentColor" strokeWidth="2" opacity="0.5"/>
                  <circle cx="100" cy="100" r="40" stroke="currentColor" strokeWidth="2"/>
                  <path d="M100 20L160 70L160 130L100 180L40 130L40 70Z" stroke="currentColor" strokeWidth="2.5" fill="currentColor" opacity="0.1"/>
                  <circle cx="100" cy="100" r="3" fill="currentColor"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className={`py-24 px-4 sm:px-6 lg:px-8 transition-colors ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className={`text-5xl font-bold mb-4 ${isDark ? 'text-white' : 'text-indigo-900'}`}>
              Why Shakya Labs Exists
            </h2>
            <p className={`text-xl ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
              The core principles that guide Shakya Labs' approach to software engineering
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: "Problem-First Thinking",
                desc: "We begin by deeply understanding your challenges and goals. Not solutions looking for problems, but engineering that addresses real needs with strategic clarity."
              },
              {
                title: "Long-Term Value Creation",
                desc: "Your technical decisions today shape your business tomorrow. We design systems built to scale, maintain, and evolve sustainably without technical debt."
              },
              {
                title: "Clarity Over Complexity",
                desc: "Complex problems don't require convoluted solutions. We architect systems that are intelligible, maintainable, and elegant so your team owns their technology."
              },
              {
                title: "Scalable Excellence",
                desc: "From MVP to millions of users. We build foundations that grow with you. Architecture that enables exponential scale without compromising quality."
              }
            ].map((item, idx) => (
              <div 
                key={idx}
                className={`p-8 rounded-2xl transition-all transform hover:scale-105 hover:shadow-xl border-2 ${isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 hover:border-indigo-500' : 'bg-gray-50 hover:bg-indigo-50 border-gray-200 hover:border-indigo-300'}`}
              >
                <div className={`w-12 h-12 rounded-lg mb-4 flex items-center justify-center font-bold text-lg ${isDark ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-900'}`}>
                  {idx + 1}
                </div>
                <h3 className={`text-xl font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {item.title}
                </h3>
                <p className={isDark ? 'text-slate-300' : 'text-gray-700'}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className={`py-24 px-4 sm:px-6 lg:px-8 transition-colors ${isDark ? 'bg-slate-950' : 'bg-gray-50'}`}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className={`text-5xl font-bold mb-4 ${isDark ? 'text-white' : 'text-indigo-900'}`}>
              What Shakya Labs Delivers
            </h2>
            <p className={`text-xl ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
              Services designed to accelerate your technical success
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: "Custom Software Development", icon: "⚙️", desc: "Bespoke applications engineered from the ground up to fit your business model perfectly." },
              { title: "Backend & API Engineering", icon: "🔌", desc: "Robust, performant backends with scalable APIs designed for enterprise-grade reliability." },
              { title: "System Architecture Design", icon: "🏗️", desc: "Strategic infrastructure planning and architecture reviews for long-term technical success." },
              { title: "Automation & DevOps", icon: "🤖", desc: "Custom automation solutions and DevOps services that empower your team and reduce friction." },
              { title: "Technical Consulting", icon: "💡", desc: "Expert guidance on technology decisions, architecture reviews, and modernization strategies." },
              { title: "Team Augmentation", icon: "👥", desc: "Experienced engineers integrated seamlessly with your culture and workflow." }
            ].map((service, idx) => (
              <div
                key={idx}
                className={`p-8 rounded-2xl border-2 transition-all transform hover:scale-105 hover:shadow-xl group ${isDark ? 'bg-slate-800 border-slate-700 hover:border-indigo-500' : 'bg-white border-gray-200 hover:border-indigo-300'}`}
              >
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">{service.icon}</div>
                <h3 className={`text-xl font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {service.title}
                </h3>
                <p className={isDark ? 'text-slate-300' : 'text-gray-700'}>
                  {service.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Section */}
      <section id="whyus" className={`py-24 px-4 sm:px-6 lg:px-8 transition-colors ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className={`text-5xl font-bold mb-4 ${isDark ? 'text-white' : 'text-indigo-900'}`}>
              Why Partner with Shakya Labs
            </h2>
            <p className={`text-xl ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
              Four reasons Shakya Labs stands apart in software engineering
            </p>
          </div>
          
          <div className="space-y-8">
            {[
              { num: "01", title: "Deep Technical Expertise", desc: "Years of proven experience building systems at scale across diverse industries and technologies." },
              { num: "02", title: "Outcome-Focused Approach", desc: "Success is measured by your business results and ROI, not by technology trends or complexity." },
              { num: "03", title: "Transparent Partnership", desc: "Clear communication, realistic timelines, and true collaboration throughout every project phase." },
              { num: "04", title: "Quality-First Mentality", desc: "Well-architected code, comprehensive testing, and maintainable systems that last." }
            ].map((item, idx) => (
              <div key={idx} className="flex gap-8 group">
                <div className={`flex-shrink-0 w-24 h-24 rounded-2xl flex items-center justify-center font-bold text-2xl transition-all transform group-hover:scale-110 ${isDark ? 'bg-indigo-600/20 text-indigo-400 group-hover:bg-indigo-600/40' : 'bg-indigo-100 text-indigo-900 group-hover:bg-indigo-200'}`}>
                  {item.num}
                </div>
                <div className="pt-2 transform transition-all group-hover:translate-x-2">
                  <h3 className={`text-2xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {item.title}
                  </h3>
                  <p className={`text-lg ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className={`py-24 px-4 sm:px-6 lg:px-8 transition-colors ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
        <div className="max-w-3xl mx-auto">
          <div className={`rounded-3xl p-12 transition-all ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800' : 'bg-gradient-to-br from-indigo-900 to-indigo-800 border border-indigo-700'}`}>
            <h2 className="text-4xl font-bold mb-4 text-center text-white">
              Partner with Shakya Labs Today
            </h2>
            <p className="text-center mb-12 text-indigo-100">
              Have a project in mind? Let's discuss how Shakya Labs can transform your vision into reality and drive measurable business success.
            </p>

            {formSubmitted ? (
              <div className="bg-green-500/20 border border-green-500 text-green-100 p-6 rounded-xl text-center font-semibold mb-8 animate-pulse">
                ✓ Thank you! We'll be in touch soon.
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-3 text-white">
                  Your Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 rounded-lg font-medium transition-all ${
                    formErrors.name 
                      ? `${isDark ? 'bg-slate-800 border border-red-500' : 'bg-indigo-800 border border-red-500'}`
                      : `${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-indigo-800 border border-indigo-700'}`
                  } text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent`}
                  placeholder="John Doe"
                />
                {formErrors.name && <p className="text-red-400 text-sm mt-1">{formErrors.name}</p>}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-3 text-white">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 rounded-lg font-medium transition-all ${
                    formErrors.email
                      ? `${isDark ? 'bg-slate-800 border border-red-500' : 'bg-indigo-800 border border-red-500'}`
                      : `${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-indigo-800 border border-indigo-700'}`
                  } text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent`}
                  placeholder="john@example.com"
                />
                {formErrors.email && <p className="text-red-400 text-sm mt-1">{formErrors.email}</p>}
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-3 text-white">
                  Tell us about your project *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows="5"
                  className={`w-full px-4 py-3 rounded-lg font-medium transition-all resize-none ${
                    formErrors.message
                      ? `${isDark ? 'bg-slate-800 border border-red-500' : 'bg-indigo-800 border border-red-500'}`
                      : `${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-indigo-800 border border-indigo-700'}`
                  } text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent`}
                  placeholder="Describe your project, goals, timeline, and any specific requirements..."
                ></textarea>
                {formErrors.message && <p className="text-red-400 text-sm mt-1">{formErrors.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-6 py-4 bg-white text-indigo-900 font-bold rounded-lg hover:bg-indigo-50 transition-all transform hover:scale-105 text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '⏳ Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`transition-colors ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-gray-900 border-gray-800'} border-t py-16 px-4 sm:px-6 lg:px-8`}>
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="text-indigo-400">
                  <ShyakaLabsLogo className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Shakya Labs</h3>
                  <p className="text-xs text-rose-400 font-light">Built with Love 💕</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                Building scalable software solutions with ancient wisdom and modern engineering. Transforming ideas into impact.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#about" className="hover:text-indigo-400 transition-colors transform hover:translate-x-1 inline-block">→ About</a></li>
                <li><a href="#services" className="hover:text-indigo-400 transition-colors transform hover:translate-x-1 inline-block">→ Services</a></li>
                <li><a href="#whyus" className="hover:text-indigo-400 transition-colors transform hover:translate-x-1 inline-block">→ Why Us</a></li>
                <li><a href="#contact" className="hover:text-indigo-400 transition-colors transform hover:translate-x-1 inline-block">→ Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Connect</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-indigo-400 transition-colors transform hover:translate-x-1 inline-block">→ LinkedIn</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition-colors transform hover:translate-x-1 inline-block">→ Twitter</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition-colors transform hover:translate-x-1 inline-block">→ GitHub</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition-colors transform hover:translate-x-1 inline-block">→ Email</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Special 💝</h4>
              <button
                onClick={() => setCurrentPage('birthday')}
                className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold hover:from-pink-600 hover:to-rose-600 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl text-sm"
              >
                🎉 Birthday Wish
              </button>
              <p className="text-gray-500 text-xs mt-3 italic text-center">
                For that special girl 💕
              </p>
            </div>
          </div>

          <div className={`border-t ${isDark ? 'border-slate-800' : 'border-gray-800'} py-8`}>
            <p className="text-gray-400 text-sm mb-4 italic text-center">
              ✨ Crafted with precision, passion, and care by Saurav ✨
            </p>
          </div>

          <div className={`border-t ${isDark ? 'border-slate-800' : 'border-gray-800'} pt-8 flex flex-col md:flex-row justify-between items-center text-gray-400 text-sm`}>
            <p>© {new Date().getFullYear()} Shakya Labs. All rights reserved.</p>
            <p>Built with React, Tailwind CSS & ❤️</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
