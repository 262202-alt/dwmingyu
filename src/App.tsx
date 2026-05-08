/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Utensils, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Settings,
  Info,
  BookOpen,
  Home as HomeIcon,
  Bell,
  Moon,
  Sun,
  Cloud,
  Palette,
  GraduationCap,
  BarChart3,
  LineChart as LineChartIcon,
  Trash2,
  MessageSquare,
  CheckCircle2,
  Link
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { format, addDays, startOfWeek, isSameDay, isAfter, isBefore, setHours, setMinutes } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/src/lib/utils';
import { SCHOOL_EVENTS, type DaySchedule, type Meal, type SchoolEvent } from './constants';
import { searchSchool, getMeal, getTimetable, type SchoolInfo, type MealInfo, type TimetableEntry as NeisTimetableEntry } from './services/neisService';
import { Search } from 'lucide-react';

type Tab = 'home' | 'timetable' | 'meal' | 'grades' | 'settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [realMeal, setRealMeal] = useState<MealInfo | null>(null);
  const [isLoadingMeal, setIsLoadingMeal] = useState(false);
  const [realTimetable, setRealTimetable] = useState<NeisTimetableEntry[]>([]);
  const [isLoadingTimetable, setIsLoadingTimetable] = useState(false);

  // User Customization State
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [bgImage, setBgImage] = useState(() => localStorage.getItem('bgImage') || '');
  const [chartType, setChartType] = useState<'bar' | 'line'>(() => (localStorage.getItem('chartType') as 'bar' | 'line') || 'bar');
  const [googleFormUrl, setGoogleFormUrl] = useState(() => localStorage.getItem('googleFormUrl') || 'https://docs.google.com/forms/d/1RoMkNHyg8cvH-ldJwhMhYo8z3TanJCGBoGgbsl3zEwc/viewform');
  
  // School Info State
  const [selectedSchool, setSelectedSchool] = useState<SchoolInfo | null>(() => {
    const saved = localStorage.getItem('selectedSchool');
    return saved ? JSON.parse(saved) : {
      ATPT_OFCDC_SC_CODE: 'B10',
      SD_SCHUL_CODE: '7041151',
      SCHUL_NM: '등원중학교',
      SCHUL_KND_SC_NM: '중학교',
      ORG_RDNMA: '서울특별시 강서구 등촌로13바길 50'
    };
  });
  const [userGrade, setUserGrade] = useState(() => localStorage.getItem('userGrade') || '2');
  const [userClass, setUserClass] = useState(() => localStorage.getItem('userClass') || '2');
  const [schoolSearchQuery, setSchoolSearchQuery] = useState('');
  const [schoolSearchResults, setSchoolSearchResults] = useState<SchoolInfo[]>([]);
  const [isSearchingSchool, setIsSearchingSchool] = useState(false);
  const [grades, setGrades] = useState<{subject: string, score: string}[]>(() => {
    const saved = localStorage.getItem('grades');
    return saved ? JSON.parse(saved) : [
      { subject: '국어', score: '95' },
      { subject: '수학', score: '88' },
      { subject: '영어', score: '100' }
    ];
  });

  const schoolName = selectedSchool?.SCHUL_NM || "학교 미설정";
  const gradeClass = `${userGrade}학년 ${userClass}반`;

  useEffect(() => {
    localStorage.setItem('selectedSchool', JSON.stringify(selectedSchool));
  }, [selectedSchool]);

  useEffect(() => {
    localStorage.setItem('userGrade', userGrade);
  }, [userGrade]);

  useEffect(() => {
    localStorage.setItem('userClass', userClass);
  }, [userClass]);

  useEffect(() => {
    localStorage.setItem('darkMode', isDarkMode.toString());
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('bgImage', bgImage);
  }, [bgImage]);

  useEffect(() => {
    localStorage.setItem('grades', JSON.stringify(grades));
  }, [grades]);

  useEffect(() => {
    localStorage.setItem('chartType', chartType);
  }, [chartType]);

  const getUpcomingEvents = () => {
    return SCHOOL_EVENTS.filter(event => isAfter(new Date(event.date), new Date()) || isSameDay(new Date(event.date), new Date()))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3);
  };

  useEffect(() => {
    if (activeTab === 'meal' || activeTab === 'home') {
      loadMeal();
    }
  }, [selectedDate, activeTab, selectedSchool]);

  useEffect(() => {
    if (activeTab === 'timetable' || activeTab === 'home') {
      loadTimetable();
    }
  }, [selectedDate, activeTab, selectedSchool, userGrade, userClass]);

  const loadMeal = async () => {
    if (!selectedSchool) return;
    
    setIsLoadingMeal(true);
    const dateStr = format(selectedDate, 'yyyyMMdd');
    const data = await getMeal(selectedSchool.ATPT_OFCDC_SC_CODE, selectedSchool.SD_SCHUL_CODE, dateStr);
    setRealMeal(data);
    setIsLoadingMeal(false);
  };

  const loadTimetable = async () => {
    if (!selectedSchool) return;
    
    setIsLoadingTimetable(true);
    const dateStr = format(selectedDate, 'yyyyMMdd');
    const data = await getTimetable(
      selectedSchool.ATPT_OFCDC_SC_CODE, 
      selectedSchool.SD_SCHUL_CODE, 
      selectedSchool.SCHUL_KND_SC_NM,
      dateStr,
      userGrade,
      userClass
    );
    setRealTimetable(data);
    setIsLoadingTimetable(false);
  };

  const handleSchoolSearch = async () => {
    if (!schoolSearchQuery.trim()) return;
    setIsSearchingSchool(true);
    const results = await searchSchool(schoolSearchQuery);
    setSchoolSearchResults(results);
    setIsSearchingSchool(false);
  };

  // Map index to MOCK_TIMETABLE index (Mon-Fri is 0-4)

  const calculateDDay = (targetDateStr: string) => {
    const target = new Date(targetDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'D-Day';
    if (diffDays < 0) return `D+${Math.abs(diffDays)}`;
    return `D-${diffDays}`;
  };

  const getCurrentStatus = () => {
    const now = new Date();
    const day = now.getDay();
    if (day === 0 || day === 6) return { label: '주말', title: '수업이 없어요', time: '즐거운 주말 보내세요!', icon: 'coffee' };

    const hours = now.getHours();
    const minutes = now.getMinutes();
    const timeVal = hours * 60 + minutes;

    const schedule = [
      { start: 0, end: 500, label: '이른 아침', title: '꿈나라 여행 중', time: '08:20 등교 시작' },
      { start: 500, end: 510, label: '조례 준비', title: '조례 준비 중', time: '08:20 - 08:30' },
      { start: 510, end: 520, label: '조례 시간', title: '조례 및 독서', time: '08:30 - 08:40' },
      { start: 520, end: 530, label: '쉬는 시간', title: '수업 준비 중', time: '08:40 - 08:50' },
      { start: 530, end: 575, label: '1교시', title: '수업 중', time: '08:50 - 09:35' },
      { start: 575, end: 585, label: '쉬는 시간', title: '휴식 중', time: '09:35 - 09:45' },
      { start: 585, end: 630, label: '2교시', title: '수업 중', time: '09:45 - 10:30' },
      { start: 630, end: 640, label: '쉬는 시간', title: '휴식 중', time: '10:30 - 10:40' },
      { start: 640, end: 685, label: '3교시', title: '수업 중', time: '10:40 - 11:25' },
      { start: 685, end: 695, label: '쉬는 시간', title: '휴식 중', time: '11:25 - 11:35' },
      { start: 695, end: 740, label: '4교시', title: '수업 중', time: '11:35 - 12:20' },
      { start: 740, end: 800, label: '점심 시간', title: '맛있는 점심!', time: '12:20 - 13:20' },
      { start: 800, end: 845, label: '5교시', title: '수업 중', time: '13:20 - 14:05' },
      { start: 845, end: 855, label: '쉬는 시간', title: '휴식 중', time: '14:05 - 14:15' },
      { start: 855, end: 900, label: '6교시', title: '수업 중', time: '14:15 - 15:00' },
      { start: 900, end: 910, label: '쉬는 시간', title: '휴식 중', time: '15:00 - 15:10' },
      { start: 910, end: 955, label: '7교시', title: '수업 중', time: '15:10 - 15:55' },
      { start: 955, end: 980, label: '종례 시간', title: '종례 및 청소', time: '15:55 - 16:20' },
      { start: 980, end: 1440, label: '하교', title: '수업이 없어요', time: '내일 만나요!' },
    ];

    const current = schedule.find(s => timeVal >= s.start && timeVal < s.end);
    
    if (current && current.label.includes('교시')) {
      const periodIdx = parseInt(current.label) - 1;
      const period = realTimetable.find(p => p.period === (periodIdx + 1));
      if (period) {
        return { ...current, title: `${period.subject} 수업 중` };
      }
    }

    return current || { label: '하교', title: '수업이 없어요', time: '내일 만나요!' };
  };

  const currentStatus = getCurrentStatus();

  return (
    <div 
      className={cn(
        "min-h-screen transition-colors duration-300 font-sans selection:bg-indigo-100",
        isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
      )}
      style={bgImage ? { 
        backgroundImage: `linear-gradient(rgba(0,0,0,${isDarkMode ? 0.7 : 0.1}), rgba(0,0,0,${isDarkMode ? 0.7 : 0.1})), url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      } : {}}
    >
      {/* Header */}
      <header className={cn(
        "sticky top-0 z-10 backdrop-blur-md border-b px-4 py-3 flex items-center justify-between transition-colors",
        isDarkMode ? "bg-slate-900/80 border-slate-800" : "bg-white/80 border-slate-200"
      )}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
            <BookOpen size={18} />
          </div>
          <h1 className="font-bold text-lg tracking-tight">{schoolName}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={cn(
              "p-2 rounded-full transition-colors",
              isDarkMode ? "hover:bg-slate-800 text-yellow-400" : "hover:bg-slate-100 text-slate-500"
            )}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={cn(
              "p-2 rounded-full transition-colors",
              isDarkMode ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"
            )}
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto pb-24">
        {/* Date Selector */}
        <div className="p-4 bg-white border-b border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-xl">
              {format(selectedDate, 'M월 d일 (eeee)', { locale: ko })}
            </h2>
            <div className="flex gap-1">
              <button 
                onClick={() => setSelectedDate(prev => addDays(prev, -1))}
                className="p-1.5 hover:bg-slate-100 rounded-md transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={() => setSelectedDate(new Date())}
                className="px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
              >
                오늘
              </button>
              <button 
                onClick={() => setSelectedDate(prev => addDays(prev, 1))}
                className="p-1.5 hover:bg-slate-100 rounded-md transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="flex justify-between">
            {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
              const date = addDays(currentWeekStart, offset);
              const isSelected = isSameDay(date, selectedDate);
              const isToday = isSameDay(date, new Date());
              
              return (
                <button
                  key={offset}
                  onClick={() => setSelectedDate(date)}
                  className={cn(
                    "flex flex-col items-center gap-1 w-10 py-2 rounded-xl transition-all",
                    isSelected ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "hover:bg-slate-50",
                    !isSelected && isToday && "text-indigo-600 font-bold"
                  )}
                >
                  <span className="text-[10px] opacity-70 uppercase font-medium">
                    {format(date, 'eee', { locale: ko })}
                  </span>
                  <span className="text-sm font-bold">
                    {format(date, 'd')}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4">
          <AnimatePresence mode="wait">
            {activeTab === 'home' ? (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Welcome Card */}
                <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
                  <div className="relative z-10">
                    <p className="text-indigo-100 text-sm font-medium mb-1">{gradeClass}</p>
                    <h3 className="text-2xl font-bold mb-4">오늘도 즐거운 하루!<br />화이팅 하세요! 🚀</h3>
                    <div className="flex gap-4">
                      <div className="bg-white/20 backdrop-blur-md rounded-2xl p-3 flex-1">
                        <p className="text-[10px] text-indigo-100 mb-1 uppercase font-bold">중간고사 D-Day</p>
                        <p className="text-xl font-black">{calculateDDay('2026-04-30')}</p>
                      </div>
                      <div className="bg-white/20 backdrop-blur-md rounded-2xl p-3 flex-1">
                        <p className="text-[10px] text-indigo-100 mb-1 uppercase font-bold">여름방학 D-Day</p>
                        <p className="text-xl font-black">{calculateDDay('2026-07-13')}</p>
                      </div>
                    </div>
                  </div>
                  <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                </div>

                {/* Upcoming Events Section */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-500 text-sm flex items-center gap-1.5">
                    <Calendar size={14} /> 다가오는 학교 행사
                  </h4>
                  <div className="bg-white p-2 rounded-3xl border border-slate-100 shadow-sm">
                    {getUpcomingEvents().map((event, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-2xl transition-colors">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0",
                          event.type === 'exam' ? "bg-red-50 text-red-600" :
                          event.type === 'holiday' ? "bg-green-50 text-green-600" :
                          "bg-blue-50 text-blue-600"
                        )}>
                          <span className="text-[10px] font-bold leading-none">{format(new Date(event.date), 'M/d')}</span>
                          <span className="text-[8px] font-medium">{format(new Date(event.date), 'eee', { locale: ko })}</span>
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="text-sm font-bold text-slate-700 truncate">{event.title}</p>
                          <p className="text-[10px] text-slate-400">{calculateDDay(event.date)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Current Class Section */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-500 text-sm flex items-center gap-1.5">
                    <Clock size={14} /> 지금은 무슨 시간?
                  </h4>
                  <div className={cn(
                    "p-5 rounded-3xl border shadow-sm flex items-center justify-between transition-colors",
                    isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
                  )}>
                    <div>
                      <p className="text-xs text-indigo-400 font-bold mb-1">현재 {currentStatus.label}</p>
                      <h5 className={cn(
                        "text-xl font-bold transition-colors",
                        isDarkMode ? "text-slate-100" : "text-slate-800"
                      )}>{currentStatus.title}</h5>
                      <p className="text-xs text-slate-400 mt-1">{currentStatus.time}</p>
                    </div>
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                      isDarkMode ? "bg-indigo-900/30 text-indigo-400" : "bg-indigo-50 text-indigo-600"
                    )}>
                      {currentStatus.label === '하교' || currentStatus.label === '주말' ? (
                        <HomeIcon size={24} />
                      ) : currentStatus.label === '점심 시간' ? (
                        <Utensils size={24} />
                      ) : (
                        <BookOpen size={24} />
                      )}
                    </div>
                  </div>
                </div>

                {/* Weather Widget (Mock) */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-500 text-sm flex items-center gap-1.5">
                    <Cloud size={14} /> 오늘 날씨
                  </h4>
                  <div className={cn(
                    "p-5 rounded-3xl border shadow-sm flex items-center justify-between transition-colors",
                    isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
                  )}>
                    <div className="flex items-center gap-4">
                      <div className="text-orange-400">
                        <Sun size={32} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">18°</p>
                        <p className="text-xs text-slate-400">맑음 · 등교하기 좋은 날</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-indigo-400">미세먼지</p>
                      <p className="text-sm font-bold text-green-500">좋음</p>
                    </div>
                  </div>
                </div>

                {/* Today's Meal Summary */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-500 text-sm flex items-center gap-1.5">
                      <Utensils size={14} /> 오늘 뭐 먹지?
                    </h4>
                    <button 
                      onClick={() => setActiveTab('meal')}
                      className="text-xs font-bold text-indigo-400"
                    >
                      더보기
                    </button>
                  </div>
                  <div className={cn(
                    "p-5 rounded-3xl border shadow-sm transition-colors",
                    isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
                  )}>
                    {realMeal ? (
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors",
                          isDarkMode ? "bg-orange-900/30 text-orange-400" : "bg-orange-50 text-orange-500"
                        )}>
                          <Utensils size={28} />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className={cn(
                            "text-sm font-bold truncate transition-colors",
                            isDarkMode ? "text-slate-200" : "text-slate-700"
                          )}>
                            {realMeal.menu.slice(0, 3).join(', ')}...
                          </p>
                          <p className="text-xs text-slate-400 mt-1">{realMeal.calories}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 text-center py-2">급식 정보를 불러오는 중...</p>
                    )}
                  </div>
                </div>

                {/* Feedback Shortcut on Home */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button 
                    onClick={() => {
                      if (googleFormUrl) {
                        window.open(googleFormUrl, '_blank');
                      } else {
                        setActiveTab('settings');
                        alert('제작자님이 아직 설문지 링크를 등록하지 않았습니다. 설정에서 링크를 확인해 보세요!');
                      }
                    }}
                    className={cn(
                      "w-full p-4 rounded-2xl flex items-center justify-between transition-all group",
                      isDarkMode ? "bg-indigo-900/20 text-indigo-400" : "bg-indigo-50 text-indigo-600"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white dark:bg-indigo-900/50 rounded-xl">
                        <MessageSquare size={18} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold">건의사항/버그 제보</p>
                        <p className="text-[10px] opacity-70">구글 설문지로 의견을 보내주세요!</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            ) : activeTab === 'timetable' ? (
              <motion.div
                key="timetable"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-slate-500 text-sm flex items-center gap-1.5">
                    <Clock size={14} /> 오늘의 시간표
                  </h3>
                  {isLoadingTimetable && <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />}
                </div>
                
                <div className="space-y-3">
                  {/* 조회/조례 시간 */}
                  <div className={cn(
                    "p-4 rounded-2xl border flex items-center justify-between transition-colors",
                    isDarkMode ? "bg-slate-900/50 border-slate-800" : "bg-slate-50 border-slate-100"
                  )}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-200 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 text-xs font-bold">
                        조회
                      </div>
                      <div>
                        <p className="font-bold text-sm">조회 및 독서시간</p>
                        <p className="text-[10px] text-slate-400">08:30 - 08:40</p>
                      </div>
                    </div>
                  </div>

                  {realTimetable.length > 0 ? (
                    realTimetable.map((period, idx) => (
                      <React.Fragment key={idx}>
                        <div className={cn(
                          "p-4 rounded-2xl border flex items-center justify-between transition-colors",
                          isDarkMode ? "bg-white/5 border-slate-800" : "bg-white border-slate-100 shadow-sm"
                        )}>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                              {period.period}
                            </div>
                            <div>
                              <p className="font-bold text-sm">{period.subject}</p>
                              <p className="text-[10px] text-slate-400">{period.time}</p>
                            </div>
                          </div>
                        </div>
                        {/* 쉬는 시간 표시 */}
                        {idx < realTimetable.length - 1 && (
                          <div className="flex justify-center py-1">
                            <div className="h-4 w-0.5 bg-slate-200 dark:bg-slate-800" />
                            <span className="text-[9px] text-slate-400 mx-2 font-medium">10분 쉬는시간</span>
                            <div className="h-4 w-0.5 bg-slate-200 dark:bg-slate-800" />
                          </div>
                        )}
                        {/* 점심 시간 표시 (4교시 후) */}
                        {period.period === 4 && (
                          <div className={cn(
                            "p-3 rounded-2xl border border-dashed flex items-center justify-center gap-2 transition-colors",
                            isDarkMode ? "bg-orange-900/10 border-orange-900/30 text-orange-400" : "bg-orange-50 border-orange-100 text-orange-500"
                          )}>
                            <Utensils size={14} />
                            <span className="text-xs font-bold">점심시간 (12:20 - 13:20)</span>
                          </div>
                        )}
                      </React.Fragment>
                    ))
                  ) : !isLoadingTimetable && (
                    <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2 rounded-3xl border border-dashed transition-colors">
                      <Clock size={48} strokeWidth={1} />
                      <p className="font-medium">시간표 정보가 없습니다</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : activeTab === 'meal' ? (
              <motion.div
                key="meal"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-slate-500 text-sm flex items-center gap-1.5">
                    <Utensils size={14} /> 오늘의 급식
                  </h3>
                  {isLoadingMeal && (
                    <div className="flex items-center gap-2 text-indigo-400">
                      <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                      <span className="text-[10px] font-bold">정보 가져오는 중...</span>
                    </div>
                  )}
                </div>

                {realMeal ? (
                  <div className={cn(
                    "rounded-3xl border overflow-hidden shadow-sm transition-colors",
                    isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
                  )}>
                    <div className="bg-indigo-600 p-6 text-white">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-indigo-100 text-xs font-medium mb-1">중식</p>
                          <h4 className="text-2xl font-bold">맛있는 점심시간</h4>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold">
                          {realMeal.calories}
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <ul className="space-y-3">
                        {realMeal.menu.map((item, idx) => (
                          <li key={idx} className={cn(
                            "flex items-center gap-3 font-medium transition-colors",
                            isDarkMode ? "text-slate-200" : "text-slate-700"
                          )}>
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                            {item}
                          </li>
                        ))}
                      </ul>
                      {realMeal.origin && (
                        <div className={cn(
                          "mt-8 p-4 rounded-2xl flex items-start gap-3 transition-colors",
                          isDarkMode ? "bg-slate-800" : "bg-slate-50"
                        )}>
                          <Info size={16} className="text-slate-400 mt-0.5" />
                          <p className="text-xs text-slate-500 leading-relaxed">
                            원산지: {realMeal.origin}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : !isLoadingMeal ? (
                  <div className={cn(
                    "py-20 flex flex-col items-center justify-center text-slate-400 gap-2 rounded-3xl border border-dashed transition-colors",
                    isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                  )}>
                    <Utensils size={48} strokeWidth={1} />
                    <p className="font-medium">급식 정보가 없습니다</p>
                    <button 
                      onClick={loadMeal}
                      className="mt-2 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-full hover:bg-indigo-700 transition-colors"
                    >
                      다시 시도
                    </button>
                  </div>
                ) : (
                  <div className={cn(
                    "py-20 flex flex-col items-center justify-center text-slate-400 gap-2 rounded-3xl border animate-pulse transition-colors",
                    isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
                  )}>
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full mb-2" />
                    <div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded" />
                  </div>
                )}
              </motion.div>
            ) : activeTab === 'grades' ? (
              <motion.div
                key="grades"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-500 text-sm flex items-center gap-1.5">
                    <GraduationCap size={14} /> 나의 성적 관리
                  </h3>
                  <div className="flex gap-3">
                    {grades.length > 0 && (
                      <button 
                        onClick={() => {
                          if (confirm('모든 성적 데이터를 삭제할까요?')) {
                            setGrades([]);
                          }
                        }}
                        className="text-xs font-bold text-red-400"
                      >
                        전체 삭제
                      </button>
                    )}
                    <button 
                      onClick={() => setGrades([...grades, { subject: '', score: '' }])}
                      className="text-xs font-bold text-indigo-400"
                    >
                      + 추가하기
                    </button>
                  </div>
                </div>

                {/* Average Score Summary */}
                {grades.length > 0 && (
                  <div className={cn(
                    "p-5 rounded-3xl border flex items-center justify-between transition-colors",
                    isDarkMode ? "bg-indigo-900/40 border-indigo-900/50" : "bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-200"
                  )}>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-xl text-white">
                        <GraduationCap size={20} />
                      </div>
                      <div>
                        <p className="text-indigo-100 text-[10px] font-bold">전체 평균 점수</p>
                        <p className="text-white text-xl font-bold">
                          {(() => {
                            const validGrades = grades.filter(g => g.score !== '' && !isNaN(parseFloat(g.score)));
                            return validGrades.length > 0 
                              ? (validGrades.reduce((sum, g) => sum + parseFloat(g.score), 0) / validGrades.length).toFixed(1)
                              : '0';
                          })()}점
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-indigo-100 text-[10px] font-bold">등록된 과목</p>
                      <p className="text-white text-lg font-bold">{grades.length}개</p>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {grades.map((grade, idx) => (
                    <div key={idx} className={cn(
                      "p-4 rounded-2xl border flex items-center gap-3 transition-colors",
                      isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"
                    )}>
                      <input 
                        type="text"
                        value={grade.subject}
                        onChange={(e) => {
                          const newGrades = grades.map((g, i) => 
                            i === idx ? { ...g, subject: e.target.value } : g
                          );
                          setGrades(newGrades);
                        }}
                        placeholder="과목명"
                        className="bg-transparent border-none focus:ring-0 font-bold text-sm flex-1 outline-none"
                      />
                      <input 
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={grade.score}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          if (value.length <= 3) { // Allow up to 3 digits (0-999)
                            const newGrades = grades.map((g, i) => 
                              i === idx ? { ...g, score: value } : g
                            );
                            setGrades(newGrades);
                          }
                        }}
                        placeholder="점수"
                        className="bg-transparent border-none focus:ring-0 font-bold text-sm w-16 text-right outline-none"
                      />
                      <button 
                        onClick={() => setGrades(grades.filter((_, i) => i !== idx))}
                        className="text-red-400 p-1"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                {/* Grade Chart */}
                {grades.length > 0 && (
                  <div className={cn(
                    "p-6 rounded-3xl border transition-colors",
                    isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"
                  )}>
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="font-bold text-sm text-slate-500">성적 분포 시각화</h4>
                      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        <button 
                          onClick={() => setChartType('bar')}
                          className={cn(
                            "p-1.5 rounded-lg transition-all",
                            chartType === 'bar' 
                              ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600" 
                              : "text-slate-400 hover:text-slate-600"
                          )}
                        >
                          <BarChart3 size={16} />
                        </button>
                        <button 
                          onClick={() => setChartType('line')}
                          className={cn(
                            "p-1.5 rounded-lg transition-all",
                            chartType === 'line' 
                              ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600" 
                              : "text-slate-400 hover:text-slate-600"
                          )}
                        >
                          <LineChartIcon size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        {chartType === 'bar' ? (
                          <BarChart data={grades.filter(g => g.subject && g.score)}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#334155" : "#f1f5f9"} />
                            <XAxis 
                              dataKey="subject" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fontSize: 12, fontWeight: 600, fill: isDarkMode ? "#94a3b8" : "#64748b" }}
                            />
                            <YAxis 
                              domain={[0, 100]} 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fontSize: 12, fill: isDarkMode ? "#94a3b8" : "#64748b" }}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                borderRadius: '16px', 
                                border: 'none', 
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                                color: isDarkMode ? '#f8fafc' : '#1e293b'
                              }}
                            />
                            <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                              {grades.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366f1' : '#818cf8'} />
                              ))}
                            </Bar>
                          </BarChart>
                        ) : (
                          <LineChart data={grades.filter(g => g.subject && g.score)}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#334155" : "#f1f5f9"} />
                            <XAxis 
                              dataKey="subject" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fontSize: 12, fontWeight: 600, fill: isDarkMode ? "#94a3b8" : "#64748b" }}
                            />
                            <YAxis 
                              domain={[0, 100]} 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fontSize: 12, fill: isDarkMode ? "#94a3b8" : "#64748b" }}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                borderRadius: '16px', 
                                border: 'none', 
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                                color: isDarkMode ? '#f8fafc' : '#1e293b'
                              }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="score" 
                              stroke="#6366f1" 
                              strokeWidth={3} 
                              dot={{ r: 6, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} 
                              activeDot={{ r: 8, strokeWidth: 0 }}
                            />
                          </LineChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <h3 className="font-bold text-slate-500 text-sm flex items-center gap-1.5">
                  <GraduationCap size={14} /> 학교 및 학급 설정
                </h3>

                <div className={cn(
                  "p-5 rounded-3xl border space-y-4 transition-colors",
                  isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"
                )}>
                  <div className="space-y-3">
                    <p className="text-sm font-bold">나의 학교</p>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input 
                          type="text"
                          value={schoolSearchQuery}
                          onChange={(e) => setSchoolSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSchoolSearch()}
                          placeholder="학교 이름 검색 (예: 등원중)"
                          className={cn(
                            "w-full rounded-2xl p-3 pl-10 text-xs outline-none transition-all",
                            isDarkMode ? "bg-slate-800 text-slate-100" : "bg-slate-50 text-slate-800"
                          )}
                        />
                        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      </div>
                      <button 
                        onClick={handleSchoolSearch}
                        disabled={isSearchingSchool}
                        className="px-4 bg-indigo-600 text-white rounded-2xl text-xs font-bold disabled:opacity-50"
                      >
                        {isSearchingSchool ? '...' : '검색'}
                      </button>
                    </div>

                    {schoolSearchResults.length > 0 && (
                      <div className={cn(
                        "mt-2 rounded-2xl border max-h-48 overflow-y-auto divide-y transition-colors",
                        isDarkMode ? "bg-slate-800 border-slate-700 divide-slate-700" : "bg-white border-slate-100 divide-slate-100"
                      )}>
                        {schoolSearchResults.map((school) => (
                          <button
                            key={school.SD_SCHUL_CODE}
                            onClick={() => {
                              setSelectedSchool(school);
                              setSchoolSearchResults([]);
                              setSchoolSearchQuery('');
                            }}
                            className="w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                          >
                            <p className="text-xs font-bold">{school.SCHUL_NM}</p>
                            <p className="text-[10px] text-slate-400">{school.ORG_RDNMA}</p>
                          </button>
                        ))}
                      </div>
                    )}

                    {selectedSchool && (
                      <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                        <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold mb-1">선택된 학교</p>
                        <p className="text-xs font-bold">{selectedSchool.SCHUL_NM}</p>
                        <p className="text-[10px] text-slate-500">{selectedSchool.ORG_RDNMA}</p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <div className="flex-1 space-y-2">
                        <p className="text-xs font-bold text-slate-500">학년</p>
                        <select 
                          value={userGrade}
                          onChange={(e) => setUserGrade(e.target.value)}
                          className={cn(
                            "w-full rounded-xl p-3 text-xs outline-none appearance-none font-bold",
                            isDarkMode ? "bg-slate-800 text-slate-100" : "bg-slate-50 text-slate-800"
                          )}
                        >
                          {[1, 2, 3, 4, 5, 6].map(g => <option key={g} value={g}>{g}학년</option>)}
                        </select>
                      </div>
                      <div className="flex-1 space-y-2">
                        <p className="text-xs font-bold text-slate-500">반</p>
                        <input 
                          type="text"
                          inputMode="numeric"
                          value={userClass}
                          onChange={(e) => setUserClass(e.target.value.replace(/[^0-9]/g, ''))}
                          placeholder="반 (예: 2)"
                          className={cn(
                            "w-full rounded-xl p-3 text-xs outline-none font-bold",
                            isDarkMode ? "bg-slate-800 text-slate-100" : "bg-slate-50 text-slate-800"
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <h3 className="font-bold text-slate-500 text-sm flex items-center gap-1.5">
                  <Settings size={14} /> 앱 설정
                </h3>

                <div className="space-y-4">
                  <div className={cn(
                    "p-5 rounded-3xl border flex items-center justify-between transition-colors",
                    isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"
                  )}>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                        <Moon size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-sm">다크 모드</p>
                        <p className="text-[10px] text-slate-400">어두운 화면으로 눈 보호</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsDarkMode(!isDarkMode)}
                      className={cn(
                        "w-12 h-6 rounded-full transition-colors relative",
                        isDarkMode ? "bg-indigo-600" : "bg-slate-200"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 bg-white rounded-full absolute top-1 transition-all",
                        isDarkMode ? "left-7" : "left-1"
                      )} />
                    </button>
                  </div>

                  <div className={cn(
                    "p-5 rounded-3xl border space-y-4 transition-colors",
                    isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"
                  )}>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-xl">
                        <Palette size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-sm">배경 화면 꾸미기</p>
                        <p className="text-[10px] text-slate-400">나만의 앱으로 만들기</p>
                      </div>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {['', 'https://images.unsplash.com/photo-1519681393784-d120267933ba', 'https://images.unsplash.com/photo-1501854140801-50d01698950b', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e'].map((url, i) => (
                        <button 
                          key={i}
                          onClick={() => setBgImage(url)}
                          className={cn(
                            "w-16 h-16 rounded-xl shrink-0 border-2 transition-all overflow-hidden",
                            bgImage === url ? "border-indigo-600 scale-95" : "border-transparent"
                          )}
                        >
                          {url ? (
                            <img src={url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 text-[10px] font-bold">기본</div>
                          )}
                        </button>
                      ))}
                    </div>
                    <input 
                      type="text"
                      placeholder="이미지 URL 직접 입력"
                      value={bgImage}
                      onChange={(e) => setBgImage(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 text-xs outline-none"
                    />
                  </div>
                </div>

                <h3 className="font-bold text-slate-500 text-sm flex items-center gap-1.5 mt-4">
                  <MessageSquare size={14} /> 피드백 보내기
                </h3>

                <div className={cn(
                  "p-5 rounded-3xl border space-y-4 transition-colors",
                  isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"
                )}>
                  {googleFormUrl ? (
                    <div className="space-y-4">
                      <p className="text-xs text-slate-400 leading-relaxed">
                        제작자가 등록한 구글 설문지를 통해 의견을 보내실 수 있습니다. 보낸 내용은 제작자가 직접 확인합니다!
                      </p>
                      <button 
                        onClick={() => window.open(googleFormUrl, '_blank')}
                        className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                      >
                        <MessageSquare size={18} />
                        구글 설문지로 의견 보내기
                      </button>
                    </div>
                  ) : (
                    <div className="py-6 flex flex-col items-center justify-center text-slate-400 gap-2">
                       <MessageSquare size={32} strokeWidth={1.5} />
                       <p className="text-xs font-medium">설문지 링크가 등록되지 않았습니다</p>
                       <p className="text-[10px] opacity-60">제작자라면 아래 섹션에서 링크를 등록해 주세요.</p>
                    </div>
                  )}
                </div>

                <h3 className="font-bold text-slate-500 text-sm flex items-center gap-1.5 mt-8">
                  <Link size={14} /> 앱 관리 (제작자용 전용)
                </h3>
                <div className={cn(
                  "p-5 rounded-3xl border space-y-4 transition-colors border-indigo-200 dark:border-indigo-900",
                  isDarkMode ? "bg-slate-900" : "bg-indigo-50/30"
                )}>
                  <div className="space-y-3">
                    <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">구글 설문지 링크 등록</p>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      구글 설문지를 만드신 후 '나눠주기(보내기)' 링크를 복사해서 아래에 붙여넣어 주세요. 모든 사용자의 피드백 버튼이 이 설문지로 연결됩니다.
                    </p>
                    <div className="relative">
                      <input 
                        type="text"
                        value={googleFormUrl}
                        onChange={(e) => setGoogleFormUrl(e.target.value)}
                        placeholder="https://docs.google.com/forms/d/e/..."
                        className={cn(
                          "w-full rounded-2xl p-4 pr-12 text-xs outline-none transition-all border",
                          isDarkMode ? "bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500" : "bg-white border-slate-200 text-slate-800 placeholder:text-slate-400"
                        )}
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-500">
                        <Link size={14} />
                      </div>
                    </div>
                    {googleFormUrl && (
                      <p className="text-[10px] text-green-500 font-bold flex items-center gap-1">
                        <CheckCircle2 size={10} /> 링크가 연동되었습니다!
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl">
                  <p className="text-[10px] text-indigo-400 leading-relaxed">
                    * 모든 설정은 사용자님의 기기에만 저장됩니다. 다른 친구들이 사용자님의 앱 설정을 볼 수 없으니 안심하고 꾸미셔도 됩니다!
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className={cn(
        "fixed bottom-0 left-0 right-0 backdrop-blur-lg border-t px-6 py-3 pb-8 flex justify-around items-center max-w-md mx-auto transition-colors",
        isDarkMode ? "bg-slate-900/80 border-slate-800" : "bg-white/80 border-slate-200"
      )}>
        <button 
          onClick={() => setActiveTab('home')}
          className={cn(
            "flex flex-col items-center gap-1 transition-all",
            activeTab === 'home' ? "text-indigo-400" : "text-slate-500 hover:text-slate-400"
          )}
        >
          <div className={cn(
            "p-2 rounded-xl transition-all",
            activeTab === 'home' && "bg-indigo-900/30"
          )}>
            <HomeIcon size={24} />
          </div>
          <span className="text-[10px] font-bold">홈</span>
        </button>

        <button 
          onClick={() => setActiveTab('timetable')}
          className={cn(
            "flex flex-col items-center gap-1 transition-all",
            activeTab === 'timetable' ? "text-indigo-400" : "text-slate-500 hover:text-slate-400"
          )}
        >
          <div className={cn(
            "p-2 rounded-xl transition-all",
            activeTab === 'timetable' && "bg-indigo-900/30"
          )}>
            <Calendar size={24} />
          </div>
          <span className="text-[10px] font-bold">시간표</span>
        </button>

        <button 
          onClick={() => setActiveTab('meal')}
          className={cn(
            "flex flex-col items-center gap-1 transition-all",
            activeTab === 'meal' ? "text-indigo-400" : "text-slate-500 hover:text-slate-400"
          )}
        >
          <div className={cn(
            "p-2 rounded-xl transition-all",
            activeTab === 'meal' && "bg-indigo-900/30"
          )}>
            <Utensils size={24} />
          </div>
          <span className="text-[10px] font-bold">급식</span>
        </button>

        <button 
          onClick={() => setActiveTab('grades')}
          className={cn(
            "flex flex-col items-center gap-1 transition-all",
            activeTab === 'grades' ? "text-indigo-400" : "text-slate-500 hover:text-slate-400"
          )}
        >
          <div className={cn(
            "p-2 rounded-xl transition-all",
            activeTab === 'grades' && "bg-indigo-900/30"
          )}>
            <GraduationCap size={24} />
          </div>
          <span className="text-[10px] font-bold">성적</span>
        </button>
      </nav>
    </div>
  );
}
