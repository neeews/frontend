import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CONSENT_ITEMS } from '../constants/privacy'

// 회원가입 폼을 채우고 가입 버튼을 누르면 뜨는 약관 동의 창.
// 휴대폰에서는 아래에서 올라오는 시트로, 넓은 화면에서는 가운데 창으로 보인다.
export default function SignupConsentDialog({ open, loading, onClose, onAgree }) {
  const dialogRef = useRef(null)
  // 개인정보 보호법 제22조는 필수 동의를 다른 항목과 구분해 따로 받도록 하고 있다.
  const [agreedAge, setAgreedAge] = useState(false)
  const [agreedTerms, setAgreedTerms] = useState(false)
  const [agreedPrivacy, setAgreedPrivacy] = useState(false)

  const allAgreed = agreedAge && agreedTerms && agreedPrivacy
  const toggleAll = checked => {
    setAgreedAge(checked)
    setAgreedTerms(checked)
    setAgreedPrivacy(checked)
  }

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      // showModal 은 첫 버튼(닫기)에 포커스를 줘서 테두리가 그려진다. 창 자체에 포커스를 둔다.
      dialog.focus()
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      className="consent-dialog"
      tabIndex={-1}
      aria-labelledby="consent-title"
      // Esc 로 닫힐 때도 부모 상태를 맞춘다.
      onClose={onClose}
      // 창 바깥(배경)을 누르면 닫는다. 안쪽 내용을 누른 경우 target 은 dialog 가 아니다.
      onClick={e => { if (e.target === e.currentTarget && !loading) onClose() }}
    >
      <div className="consent-dialog-body">
        <div className="consent-dialog-head">
          <h3 id="consent-title">약관 동의</h3>
          <button type="button" className="consent-dialog-close" onClick={onClose} disabled={loading} aria-label="닫기">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <fieldset className="consent">
          <legend>약관 동의</legend>

          <label className="consent-all">
            <input type="checkbox" checked={allAgreed} onChange={e => toggleAll(e.target.checked)} />
            필수 약관에 모두 동의
          </label>

          <ul className="consent-list">
            <li className="consent-row">
              <label>
                <input type="checkbox" checked={agreedAge} onChange={e => setAgreedAge(e.target.checked)} />
                <span>만 14세 이상입니다<em>(필수)</em></span>
              </label>
            </li>
            <li className="consent-row">
              <label>
                <input type="checkbox" checked={agreedTerms} onChange={e => setAgreedTerms(e.target.checked)} />
                <span>이용약관 동의<em>(필수)</em></span>
              </label>
              <Link to="/terms" target="_blank" rel="noreferrer" className="consent-view">보기</Link>
            </li>
            <li className="consent-row">
              <label>
                <input type="checkbox" checked={agreedPrivacy} onChange={e => setAgreedPrivacy(e.target.checked)} />
                <span>개인정보 수집·이용 동의<em>(필수)</em></span>
              </label>
              <Link to="/privacy" target="_blank" rel="noreferrer" className="consent-view">보기</Link>
            </li>
          </ul>

          {/* 수집 항목·목적·보유 기간과 거부 권리는 동의 시점에 알려야 해서 창 안에 두되, 접어서 보여준다. */}
          <details className="consent-detail">
            <summary>수집하는 개인정보와 보유 기간</summary>
            <ul className="consent-items">
              {CONSENT_ITEMS.map(row => (
                <li key={row.items}>
                  <strong>{row.items}</strong>
                  {row.purpose} · {row.period}
                </li>
              ))}
            </ul>
            <p className="consent-refusal">
              동의를 거부하실 수 있으나, 위 항목은 서비스 제공에 반드시 필요한 최소한의 정보이므로
              거부 시 회원가입이 제한됩니다.
            </p>
          </details>
        </fieldset>

        <button
          type="button"
          className="btn-submit"
          onClick={onAgree}
          disabled={!allAgreed || loading}
        >
          {loading ? '가입 중...' : '동의하고 가입하기'}
        </button>
      </div>
    </dialog>
  )
}
