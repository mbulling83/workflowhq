import './ProviderLogo.css'

interface ProviderLogoProps {
  provider: string
  size?: 'small' | 'medium' | 'large'
}

function ProviderLogo({ provider, size = 'medium' }: ProviderLogoProps) {
  const getProviderIcon = (provider: string) => {
    const normalized = provider.toLowerCase()
    
    if (normalized.includes('openai')) {
      return (
        <svg viewBox="0 0 24 24" className={`provider-logo provider-logo-${size}`} fill="currentColor">
          <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/>
        </svg>
      )
    }
    
    if (normalized.includes('anthropic') || normalized.includes('claude')) {
      return (
        <svg viewBox="0 0 24 24" className={`provider-logo provider-logo-${size}`} fill="currentColor">
          <path d="M16.5088 10.9638L20.9994 23H17.8294L13.3388 10.9638H16.5088ZM7.16938 10.9638L11.6606 23H8.49063L4.00001 10.9638H7.16938ZM10.3394 1L17.8294 23H14.6594L7.16938 1H10.3394Z"/>
        </svg>
      )
    }
    
    if (normalized.includes('google') || normalized.includes('gemini')) {
      return (
        <svg viewBox="0 0 24 24" className={`provider-logo provider-logo-${size}`} fill="currentColor">
          <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 1 1 0-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0 0 12.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z"/>
        </svg>
      )
    }
    
    if (normalized.includes('openrouter')) {
      return (
        <svg viewBox="0 0 24 24" className={`provider-logo provider-logo-${size}`} fill="currentColor">
          <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l7.6 3.8-2.85 1.43L12 7.18l-4.75 2.23L4.4 7.98 12 4.18zM4 9.5l6.5 3.25v6.57L4 16.07V9.5zm9 9.82v-6.57L19.5 9.5v6.57l-6.5 3.25z"/>
        </svg>
      )
    }
    
    // Default fallback for unknown providers
    return (
      <svg viewBox="0 0 24 24" className={`provider-logo provider-logo-${size}`} fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
    )
  }

  return (
    <div className={`provider-logo-container provider-${provider.toLowerCase()}`} title={provider}>
      {getProviderIcon(provider)}
    </div>
  )
}

export default ProviderLogo
