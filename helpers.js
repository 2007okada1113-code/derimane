export const yen = (n) => '¥' + Math.round(Math.abs(n ?? 0)).toLocaleString()
export const calcRate = (e, h) => h > 0 ? Math.round(e / h) : 0
export const todayStr = () => new Date().toISOString().split('T')[0]
export const toYM = (d) => d.slice(0, 7)
export const ymLabel = (ym) => { const [y,m] = ym.split('-'); return `${y}年${parseInt(m)}月` }
export const fmtHMS = (sec) => [Math.floor(sec/3600), Math.floor((sec%3600)/60), sec%60].map(v=>String(v).padStart(2,'0')).join(':')
export const rateColor = (r) => r>=2000?'#15803D':r>=1500?'#1D4ED8':r>=1000?'#D97706':'#DC2626'
export const rateLabel = (r) => r>=2000?'最高':r>=1500?'好調':r>=1000?'普通':'低い'

export const calcStreak = (records) => {
  if (!records.length) return 0
  const dates = [...new Set(records.map(r=>r.date))].sort((a,b)=>b.localeCompare(a))
  let s=0, cur=new Date(dates[0])
  for (const d of dates) {
    const dd = new Date(d)
    if (Math.round((cur-dd)/86400000)<=1) { s++; cur=dd } else break
  }
  return s
}

const incomeTax = (t) => {
  if (t<=0) return 0
  if (t<=1950000) return Math.round(t*0.05)
  if (t<=3300000) return Math.round(t*0.1-97500)
  if (t<=6950000) return Math.round(t*0.2-427500)
  if (t<=9000000) return Math.round(t*0.23-636000)
  return Math.round(t*0.33-1536000)
}

export const calcTax = ({ annualEarnings, annualExpenses, employmentType, otherIncome, blueReturn, hasDependent }) => {
  const blueD = blueReturn ? 650000 : 0
  const depD  = hasDependent ? 380000 : 0
  const BASIC = 480000
  const profit = Math.max(0, annualEarnings - annualExpenses - blueD)

  if (employmentType === 'employee') {
    const needsReturn = profit > 200000
    const salD = otherIncome > 0 ? Math.max(550000, Math.min(1950000, otherIncome*0.3+800000)) : 0
    const taxable = Math.max(0, (otherIncome-salD) + profit - BASIC - depD)
    const income = incomeTax(taxable)
    const resident = Math.round(taxable*0.1)
    const total = income + resident
    return { profit, income, resident, biz:0, total, monthly: Math.round(total/12), needsReturn }
  } else {
    const needsReturn = profit > BASIC
    const taxable = Math.max(0, profit - BASIC - depD)
    const income = incomeTax(taxable)
    const resident = Math.round(taxable*0.1)
    const biz = profit>2900000 ? Math.round((profit-2900000)*0.03) : 0
    const total = income + resident + biz
    return { profit, income, resident, biz, total, monthly: Math.round(total/12), needsReturn }
  }
}

export const exportCSV = (records, expenses) => {
  const rows = [
    ['種別','日付','収益','基本','ブースト','クエスト','チップ','稼働h','待機h','距離km','アプリ','時間帯','天気','メモ'],
    ...records.map(r=>['収益',r.date,r.earnings,r.base_earnings??'',r.boost??0,r.quest??0,r.tip??0,r.hours,r.wait_hours??0,r.distance??0,(r.apps??[]).join('|'),r.time_slot??'',r.weather??'',r.memo??'']),
    [],
    ['種別','日付','金額','カテゴリ','距離km','メモ'],
    ...expenses.map(e=>['経費',e.date,e.amount,e.category,e.km??'',e.memo??'']),
  ]
  const csv = rows.map(r=>r.map(c=>`"${c}"`).join(',')).join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}))
  a.download = `delimane_${todayStr()}.csv`
  a.click()
}