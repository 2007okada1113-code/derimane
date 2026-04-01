import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { supabase } from '../lib/supabase'

export default function Backup() {
  const { user } = useAuth()
  const { show, Toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [restoring, setRestoring] = useState(false)

  // ── バックアップ（全データをJSONでダウンロード）──────────
  const handleBackup = async () => {
    setLoading(true)
    try {
      const [r, e, p] = await Promise.all([
        supabase.from('records').select('*').eq('user_id', user.id),
        supabase.from('expenses').select('*').eq('user_id', user.id),
        supabase.from('map_pins').select('*').eq('user_id', user.id),
      ])
      const backup = {
        version: '1.0',
        exported_at: new Date().toISOString(),
        user_id: user.id,
        records:  r.data || [],
        expenses: e.data || [],
        map_pins: p.data || [],
      }
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type:'application/json' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `delimane_backup_${new Date().toISOString().slice(0,10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      show(`バックアップ完了 ✓（記録${r.data?.length || 0}件・経費${e.data?.length || 0}件）`)
    } catch (e) {
      show('バックアップに失敗しました', 'err')
    } finally {
      setLoading(false)
    }
  }

  // ── 復元（JSONファイルを読み込んでインポート）────────────
  const handleRestore = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      setRestoring(true)
      try {
        const data = JSON.parse(ev.target.result)
        if (!data.version || !data.records) {
          show('無効なバックアップファイルです', 'err'); return
        }
        let recordCount = 0, expenseCount = 0, pinCount = 0

        // records
        if (data.records?.length > 0) {
          const rows = data.records.map(r => ({
            ...r, id:undefined, user_id: user.id, created_at:undefined,
          }))
          const { error } = await supabase.from('records').upsert(rows, { onConflict:'id' })
          if (!error) recordCount = rows.length
        }
        // expenses
        if (data.expenses?.length > 0) {
          const rows = data.expenses.map(e => ({
            ...e, id:undefined, user_id: user.id, created_at:undefined,
          }))
          const { error } = await supabase.from('expenses').upsert(rows, { onConflict:'id' })
          if (!error) expenseCount = rows.length
        }
        // map_pins
        if (data.map_pins?.length > 0) {
          const rows = data.map_pins.map(p => ({
            ...p, id:undefined, user_id: user.id, created_at:undefined,
          }))
          const { error } = await supabase.from('map_pins').upsert(rows, { onConflict:'id' })
          if (!error) pinCount = rows.length
        }
        show(`復元完了 ✓（記録${recordCount}件・経費${expenseCount}件・ピン${pinCount}件）`)
      } catch {
        show('復元に失敗しました。ファイルを確認してください', 'err')
      } finally {
        setRestoring(false)
        e.target.value = ''
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="page fade-in">
      <Toast />
      <div className="sec-title">データ管理</div>

      {/* バックアップ */}
      <div className="card" style={{ marginBottom:14 }}>
        <div style={{ padding:'16px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
            <span style={{ fontSize:28 }}>📦</span>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:'var(--text)' }}>バックアップ</div>
              <div style={{ fontSize:12, color:'var(--text3)', marginTop:1 }}>
                全データをJSONファイルとしてダウンロード
              </div>
            </div>
          </div>
          <div style={{ fontSize:12, color:'var(--text2)', background:'var(--card2)',
            borderRadius:'var(--r)', padding:'10px 12px', marginBottom:12, lineHeight:1.7 }}>
            💡 定期的にバックアップを取っておくと安心です。<br/>
            記録・経費・マップピンが保存されます。
          </div>
          <button onClick={handleBackup} disabled={loading} className="btn-brand">
            {loading ? 'バックアップ中…' : '⬇️ バックアップをダウンロード'}
          </button>
        </div>
      </div>

      {/* 復元 */}
      <div className="card" style={{ marginBottom:14 }}>
        <div style={{ padding:'16px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
            <span style={{ fontSize:28 }}>🔄</span>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:'var(--text)' }}>データを復元</div>
              <div style={{ fontSize:12, color:'var(--text3)', marginTop:1 }}>
                バックアップファイルからインポート
              </div>
            </div>
          </div>
          <div style={{ fontSize:12, color:'var(--red)', background:'var(--redLt)',
            borderRadius:'var(--r)', padding:'10px 12px', marginBottom:12, lineHeight:1.7,
            border:'1px solid #FECACA' }}>
            ⚠️ 既存データと重複する場合は上書きされます。<br/>
            先にバックアップを取ってから復元してください。
          </div>
          <label style={{ display:'block' }}>
            <input type="file" accept=".json" onChange={handleRestore}
              style={{ display:'none' }} disabled={restoring}/>
            <div className="btn-brand" style={{
              cursor:'pointer', textAlign:'center',
              opacity: restoring ? 0.4 : 1,
              background: '#18181B',
            }}>
              {restoring ? '復元中…' : '📂 バックアップファイルを選択'}
            </div>
          </label>
        </div>
      </div>

      {/* CSV出力 */}
      <div className="card">
        <div style={{ padding:'16px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
            <span style={{ fontSize:28 }}>📊</span>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:'var(--text)' }}>CSVエクスポート</div>
              <div style={{ fontSize:12, color:'var(--text3)', marginTop:1 }}>
                freee・マネーフォワードに取り込めるCSV形式
              </div>
            </div>
          </div>
          <button onClick={async () => {
            const [r, e] = await Promise.all([
              supabase.from('records').select('*').eq('user_id', user.id),
              supabase.from('expenses').select('*').eq('user_id', user.id),
            ])
            const { exportCSV } = await import('../utils/helpers')
            exportCSV(r.data || [], e.data || [])
            show('CSVをダウンロードしました ✓')
          }} className="btn-brand" style={{ background:'var(--green)' }}>
            ⬇️ CSVをダウンロード
          </button>
        </div>
      </div>
    </div>
  )
}