import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { IC } from '../components/Icons'

export default function Login() {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [mode,  setMode]   = useState('login')
  const [email, setEmail]  = useState('')
  const [pw,    setPw]     = useState('')
  const [name,  setName]   = useState('')
  const [busy,  setBusy]   = useState(false)
  const [err,   setErr]    = useState('')
  const [ok,    setOk]     = useState('')

  const submit = async e => {
    e.preventDefault(); setErr(''); setOk('')
    if (!email||!pw) return setErr('メールとパスワードを入力してください')
    if (mode==='signup'&&!name) return setErr('名前を入力してください')
    if (pw.length<6) return setErr('パスワードは6文字以上です')
    setBusy(true)
    try {
      if (mode==='login') { await signIn(email,pw); navigate('/') }
      else {
        await signUp(email,pw,name)
        setOk('確認メールを送りました。メール内のリンクをクリックしてからログインしてください。')
        setMode('login')
      }
    } catch(e){
      const m=e.message||''
      if(m.includes('Invalid login'))setErr('メールまたはパスワードが違います')
      else if(m.includes('already'))setErr('このメールは既に登録されています')
      else setErr(m||'エラーが発生しました')
    } finally{setBusy(false)}
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--white)',
      display:'flex', flexDirection:'column', alignItems:'center',
      justifyContent:'center', padding:'24px' }}>

      {/* ロゴ */}
      <div style={{ textAlign:'center', marginBottom:36 }}>
        <div style={{ width:80, height:80, background:'var(--red)', borderRadius:22,
          display:'flex', alignItems:'center', justifyContent:'center',
          margin:'0 auto 14px',
          boxShadow:'0 6px 24px rgba(232,25,44,0.38)' }}>
          {IC.bike('white', 48)}
        </div>
        <div style={{ fontFamily:'Inter,sans-serif', fontSize:26, fontWeight:900,
          letterSpacing:2, color:'var(--dark)' }}>DELIMANE</div>
        <div style={{ fontSize:12, color:'var(--g4)', marginTop:4, fontWeight:600 }}>
          デリバリー収支管理アプリ
        </div>
      </div>

      {/* カード */}
      <div style={{ width:'100%', maxWidth:380, background:'var(--white)',
        borderRadius:20, boxShadow:'0 4px 24px rgba(0,0,0,0.08)',
        border:'1px solid var(--g2)', overflow:'hidden' }}>

        {/* タブ */}
        <div style={{ display:'flex', borderBottom:'1px solid var(--g2)' }}>
          {[['login','ログイン'],['signup','新規登録']].map(([m,l])=>(
            <button key={m} onClick={()=>{setMode(m);setErr('');setOk('')}}
              style={{ flex:1, padding:'15px 0', background:'none', border:'none',
                borderBottom:`2.5px solid ${mode===m?'var(--red)':'transparent'}`,
                fontSize:14, fontWeight:700,
                color:mode===m?'var(--red)':'var(--g4)', cursor:'pointer' }}>
              {l}
            </button>
          ))}
        </div>

        <form onSubmit={submit} style={{ padding:'22px 20px', display:'flex', flexDirection:'column', gap:14 }}>
          {ok  && <div style={{ background:'#E8FFF2', border:'1px solid #A7F3D0', borderRadius:10, padding:'10px 14px', fontSize:13, color:'var(--green)', lineHeight:1.6 }}>{ok}</div>}
          {err && <div style={{ background:'#FFF0F1', border:'1px solid #FFD0D4', borderRadius:10, padding:'10px 14px', fontSize:13, color:'var(--red)' }}>{err}</div>}

          {mode==='signup' && (
            <div>
              <label className="field-label">名前</label>
              <input className="input" type="text" placeholder="ニックネームでOK"
                value={name} onChange={e=>setName(e.target.value)}/>
            </div>
          )}
          <div>
            <label className="field-label">メールアドレス</label>
            <input className="input" type="email" placeholder="example@mail.com"
              value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email"/>
          </div>
          <div>
            <label className="field-label">パスワード{mode==='signup'&&'（6文字以上）'}</label>
            <input className="input" type="password" placeholder="パスワード"
              value={pw} onChange={e=>setPw(e.target.value)}
              autoComplete={mode==='login'?'current-password':'new-password'}/>
          </div>

          <button type="submit" className="btn-red" disabled={busy} style={{marginTop:6}}>
            {busy?'処理中…':mode==='login'?'ログイン':'アカウントを作成'}
          </button>
        </form>
      </div>

      <p style={{ fontSize:11, color:'var(--g4)', marginTop:24, textAlign:'center', lineHeight:1.8 }}>
        続けることで利用規約・プライバシーポリシーに同意します
      </p>
    </div>
  )
}