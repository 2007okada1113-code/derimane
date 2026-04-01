// デバッグ用ページ（問題解決後に削除してOK）
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Debug() {
  const [results, setResults] = useState([])

  const log = (msg, ok = true) =>
    setResults(p => [...p, { msg, ok, time: new Date().toLocaleTimeString() }])

  useEffect(() => {
    const run = async () => {
      // 1. 環境変数チェック
      const url = import.meta.env.VITE_SUPABASE_URL
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY
      log(`SUPABASE_URL: ${url ? url.slice(0, 30) + '…' : '❌ 未設定'}`, !!url)
      log(`ANON_KEY: ${key ? key.slice(0, 20) + '…' : '❌ 未設定'}`, !!key)

      // 2. Supabase接続チェック
      try {
        const { data, error } = await supabase.from('profiles').select('count').limit(1)
        if (error) log(`DB接続エラー: ${error.message}`, false)
        else log('DB接続: ✅ 成功')
      } catch (e) {
        log(`DB接続失敗: ${e.message}`, false)
      }

      // 3. セッションチェック
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          log(`セッション: ✅ ログイン中 (${session.user.email})`)

          // 4. profileチェック
          const { data: prof, error: pErr } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (pErr) log(`profile取得エラー: ${pErr.message} (code: ${pErr.code})`, false)
          else log(`profile: ✅ name=${prof?.name}, role=${prof?.role}`)
        } else {
          log('セッション: ❌ 未ログイン', false)
        }
      } catch (e) {
        log(`セッションエラー: ${e.message}`, false)
      }
    }
    run()
  }, [])

  return (
    <div style={{ padding: 20, fontFamily: 'monospace', maxWidth: 430, margin: '0 auto' }}>
      <h2 style={{ fontSize: 16, marginBottom: 16 }}>🔧 デバッグ情報</h2>
      {results.length === 0 && <div style={{ color: '#999' }}>チェック中…</div>}
      {results.map((r, i) => (
        <div key={i} style={{
          padding: '8px 12px', marginBottom: 6, borderRadius: 8,
          background: r.ok ? '#F0FDF4' : '#FEF2F2',
          border: `1px solid ${r.ok ? '#A7F3D0' : '#FECACA'}`,
          fontSize: 12, color: r.ok ? '#15803D' : '#DC2626',
        }}>
          <span style={{ opacity: 0.5, marginRight: 8 }}>{r.time}</span>
          {r.msg}
        </div>
      ))}
      <div style={{ marginTop: 20, fontSize: 11, color: '#999' }}>
        このページは /debug でアクセスできます。問題解決後にDebug.jsxを削除してください。
      </div>
    </div>
  )
}