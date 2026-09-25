import type { AlertTone } from '../../types/report'

interface Props {
  tone: AlertTone
  tag: string
  title: string
  text: string
}

export function AlertItem({ tone, tag, title, text }: Props) {
  return (
    <div className={`alert ${tone}`}>
      <span className="tag">{tag}</span>
      <h4>{title}</h4>
      <p>{text}</p>
    </div>
  )
}
