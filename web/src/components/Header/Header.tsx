import logoBlack from 'assets/logo-black.svg'
import logoWhite from 'assets/logo-white.svg'
import styles from './Header.module.scss'

export default function Header() {
  return (
    <header className={styles.header}>
      <picture>
        <source srcSet={logoWhite} media="(prefers-color-scheme: dark)" />
        <img className={styles.logo} src={logoBlack} alt="Neurotype" />
      </picture>
      <span className={styles.divider} aria-hidden="true" />
      <span className={styles.title}>Assessment Review</span>
    </header>
  )
}
