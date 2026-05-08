export interface TimetableEntry {
  period: number;
  subject: string;
  time: string;
  room?: string;
}

export interface DaySchedule {
  day: string;
  periods: TimetableEntry[];
}

export const MOCK_TIMETABLE: DaySchedule[] = [
  {
    day: '월',
    periods: [
      { period: 1, subject: '과학A', time: '08:50 - 09:35' },
      { period: 2, subject: '스클', time: '09:45 - 10:30' },
      { period: 3, subject: '수학', time: '10:40 - 11:25' },
      { period: 4, subject: '국어B', time: '11:35 - 12:20' },
      { period: 5, subject: '체육', time: '13:20 - 14:05' },
      { period: 6, subject: '음악', time: '14:15 - 15:00' },
    ],
  },
  {
    day: '화',
    periods: [
      { period: 1, subject: '창체', time: '08:50 - 09:35' },
      { period: 2, subject: '음악', time: '09:45 - 10:30' },
      { period: 3, subject: '한문', time: '10:40 - 11:25' },
      { period: 4, subject: '역사A', time: '11:35 - 12:20' },
      { period: 5, subject: '수학', time: '13:20 - 14:05' },
      { period: 6, subject: '국어A', time: '14:15 - 15:00' },
      { period: 7, subject: '과학B', time: '15:10 - 15:55' },
    ],
  },
  {
    day: '수',
    periods: [
      { period: 1, subject: '체육', time: '08:50 - 09:35' },
      { period: 2, subject: '기술', time: '09:45 - 10:30' },
      { period: 3, subject: '기술', time: '10:40 - 11:25' },
      { period: 4, subject: '영어', time: '11:35 - 12:20' },
      { period: 5, subject: '한문', time: '13:20 - 14:05' },
      { period: 6, subject: '도덕', time: '14:15 - 15:00' },
    ],
  } ,
  {
    day: '목',
    periods: [
      { period: 1, subject: '영어', time: '08:50 - 09:35' },
      { period: 2, subject: '도덕', time: '09:45 - 10:30' },
      { period: 3, subject: '국어A', time: '10:40 - 11:25' },
      { period: 4, subject: '역사A', time: '11:35 - 12:20' },
      { period: 5, subject: '역사B', time: '13:20 - 14:05' },
      { period: 6, subject: '과학A', time: '14:15 - 15:00' },
      { period: 7, subject: '수학', time: '15:10 - 15:55' },
    ],
  },
  {
    day: '금',
    periods: [
      { period: 1, subject: '과학A', time: '08:50 - 09:35' },
      { period: 2, subject: '가정', time: '09:45 - 10:30' },
      { period: 3, subject: '체육', time: '10:40 - 11:25' },
      { period: 4, subject: '국어A', time: '11:35 - 12:20' },
      { period: 5, subject: '영어', time: '13:20 - 14:05' },
      { period: 6, subject: '수학', time: '14:15 - 15:00' },
    ],
  },
];

export interface SchoolEvent {
  date: string;
  title: string;
  type: 'exam' | 'holiday' | 'event' | 'club';
}

export const SCHOOL_EVENTS: SchoolEvent[] = [
  { date: '2026-04-08', title: '금요수업 (교직원연수)', type: 'event' },
  { date: '2026-04-10', title: '동아리/진로/봉사 활동', type: 'club' },
  { date: '2026-04-30', title: '중간고사 시작 (2,3학년)', type: 'exam' },
  { date: '2026-05-01', title: '중간고사 (2,3학년)', type: 'exam' },
  { date: '2026-05-04', title: '재량휴업일', type: 'holiday' },
  { date: '2026-05-05', title: '어린이날', type: 'holiday' },
  { date: '2026-05-07', title: '체육한마당', type: 'event' },
  { date: '2026-05-08', title: '금요수업 / 동아리활동', type: 'club' },
  { date: '2026-05-12', title: '금요수업', type: 'event' },
  { date: '2026-05-15', title: '현장체험활동', type: 'event' },
  { date: '2026-05-25', title: '대체공휴일', type: 'holiday' },
  { date: '2026-05-29', title: '금요수업 / 동아리활동', type: 'club' },
  { date: '2026-07-13', title: '여름방학 시작', type: 'holiday' },
];

export interface Meal {
  date: string;
  menu: string[];
  calories: string;
}

export const MOCK_MEALS: Meal[] = [
  {
    date: '2026-04-02',
    menu: ['찹쌀밥', '짬뽕국', '돈육불고기', '비엔나케찹조림', '김자반', '오이김치', '멜론'],
    calories: '909.1kcal',
  },
  {
    date: '2026-04-03',
    menu: ['혼합잡곡밥', '식목일케이크', '쇠고기미역국', '분모자찜닭', '오이무침', '햄감자채볶음', '깍두기'],
    calories: '899.9kcal',
  },
  {
    date: '2026-04-06',
    menu: ['취나물밥/양념장', '미소된장국', '비건만두', '골뱅이야채무침', '단무지', '청포도'],
    calories: '616.0kcal',
  },
];
