const NEIS_API_KEY = import.meta.env.VITE_NEIS_API_KEY;
const BASE_URL = 'https://open.neis.go.kr/hub';

export interface SchoolInfo {
  ATPT_OFCDC_SC_CODE: string;
  SD_SCHUL_CODE: string;
  SCHUL_NM: string;
  SCHUL_KND_SC_NM: string;
  ORG_RDNMA: string;
}

export interface MealInfo {
  date: string;
  menu: string[];
  calories: string;
}

export interface TimetableEntry {
  period: number;
  subject: string;
  time: string;
}

export const searchSchool = async (schoolName: string): Promise<SchoolInfo[]> => {
  if (!schoolName) return [];
  
  try {
    const response = await fetch(`${BASE_URL}/schoolInfo?KEY=${NEIS_API_KEY}&Type=json&SCHUL_NM=${encodeURIComponent(schoolName)}`);
    const data = await response.json();
    
    if (data.schoolInfo) {
      return data.schoolInfo[1].row.map((item: any) => ({
        ATPT_OFCDC_SC_CODE: item.ATPT_OFCDC_SC_CODE,
        SD_SCHUL_CODE: item.SD_SCHUL_CODE,
        SCHUL_NM: item.SCHUL_NM,
        SCHUL_KND_SC_NM: item.SCHUL_KND_SC_NM,
        ORG_RDNMA: item.ORG_RDNMA
      }));
    }
    return [];
  } catch (error) {
    console.error('Error searching school:', error);
    return [];
  }
};

export const getMeal = async (officeCode: string, schoolCode: string, date: string): Promise<MealInfo | null> => {
  try {
    const formattedDate = date.replace(/-/g, '');
    const response = await fetch(`${BASE_URL}/mealServiceDietInfo?KEY=${NEIS_API_KEY}&Type=json&ATPT_OFCDC_SC_CODE=${officeCode}&SD_SCHUL_CODE=${schoolCode}&MLSV_YMD=${formattedDate}`);
    const data = await response.json();
    
    if (data.mealServiceDietInfo) {
      const meal = data.mealServiceDietInfo[1].row[0];
      return {
        date: date,
        menu: meal.DDISH_NM.split('<br/>').map((item: string) => item.replace(/\([0-9.]+\)/g, '').trim()),
        calories: meal.CAL_INFO
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching meal:', error);
    return null;
  }
};

export const getTimetable = async (
  officeCode: string, 
  schoolCode: string, 
  schoolType: string, 
  date: string,
  grade: string,
  classNm: string
): Promise<TimetableEntry[]> => {
  try {
    const formattedDate = date.replace(/-/g, '');
    let endpoint = 'misTimetable';
    if (schoolType.includes('고등')) endpoint = 'hisTimetable';
    if (schoolType.includes('초등')) endpoint = 'elsTimetable';
    if (schoolType.includes('특수')) endpoint = 'spsTimetable';

    const response = await fetch(`${BASE_URL}/${endpoint}?KEY=${NEIS_API_KEY}&Type=json&ATPT_OFCDC_SC_CODE=${officeCode}&SD_SCHUL_CODE=${schoolCode}&ALL_TI_YMD=${formattedDate}&GRADE=${grade}&CLASS_NM=${classNm}`);
    const data = await response.json();
    
    if (data[endpoint]) {
      return data[endpoint][1].row.map((item: any) => ({
        period: parseInt(item.PERIO),
        subject: item.ITRT_CNTNT,
        time: getTimeForPeriod(parseInt(item.PERIO), schoolType)
      })).sort((a: any, b: any) => a.period - b.period);
    }
    return [];
  } catch (error) {
    console.error('Error fetching timetable:', error);
    return [];
  }
};

const getTimeForPeriod = (period: number, schoolType: string): string => {
  // Standard middle school times as fallback
  const times: { [key: number]: string } = {
    1: '08:50 - 09:35',
    2: '09:45 - 10:30',
    3: '10:40 - 11:25',
    4: '11:35 - 12:20',
    5: '13:20 - 14:05',
    6: '14:15 - 15:00',
    7: '15:10 - 15:55'
  };
  
  if (schoolType.includes('초등')) {
    const elsTimes: { [key: number]: string } = {
      1: '09:00 - 09:40',
      2: '09:50 - 10:30',
      3: '10:40 - 11:20',
      4: '11:30 - 12:10',
      5: '13:00 - 13:40',
      6: '13:50 - 14:30'
    };
    return elsTimes[period] || '';
  }
  
  return times[period] || '';
};
