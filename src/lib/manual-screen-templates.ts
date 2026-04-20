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
  .option-icon{flex-shrink:0;width:72px;height:72px;border-radius:50%;background:#f3ebff;display:flex;align-items:center;justify-content:center}
  .option-icon svg{width:56px;height:56px;display:block}
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
    <div class="email-pill" id="user-email">muca7.andrade@gmail.com</div>

    <button type="button" class="option" data-method="email">
      <span class="option-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="none" viewBox="0 0 96 96" aria-hidden="true">
          <path d="M48 90c23.196 0 42-18.804 42-42S71.196 6 48 6 6 24.804 6 48s18.804 42 42 42Z" fill="#F3EBFF"/>
          <path fill="#A1A1A1" d="m18.407 26.56 51.306-7.052c3.527-.485 6.819 1.941 7.315 5.391l5.407 37.636c.496 3.45-1.984 6.67-5.511 7.154l-51.307 7.053c-3.527.485-6.818-1.941-7.314-5.391l-5.408-37.636c-.496-3.45 1.985-6.67 5.512-7.154Z"/>
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
          <path stroke="#A1A1A1" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" stroke-width="1.5" d="m39.534 39.31.289 2.054"/>
          <path fill="#A1A1A1" d="m70.633 36.976-34.291 4.82c-6.715.944-9.156 5.527-8.425 10.725l3.132 22.287c.721 5.133 5.596 8.412 11.007 7.651l34.291-4.819c5.344-.75 9.457-3.385 7.8-10.295L81.015 45.06c-.89-6.332-3.331-9.073-10.382-8.083ZM59.366 60.36c-.117.15-.234.298-.207.493l.786 5.588c.182 1.3-.745 2.556-2.165 2.756l-.812.114c-1.352.19-2.648-.688-2.84-2.053l-.785-5.588c-.028-.194-.114-.315-.335-.416-2.5-1.107-3.917-3.823-3.074-6.658.525-1.664 1.84-3.108 3.553-3.68 3.61-1.302 7.308.961 7.792 4.405.264 1.884-.504 3.78-1.913 5.04Z"/>
          <path stroke="#5C0FA1" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" stroke-width="1.5" d="M29.941 45.118a7.176 7.176 0 0 1 4.797-2.905l38.048-5.347c3.911-.55 7.54 2.185 8.09 6.096l3.698 26.316c.55 3.91-2.185 7.54-6.096 8.089L42.087 82.48"/>
          <path stroke="#5C0FA1" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" stroke-width="1.5" d="m70.002 37.259-1.24-8.816c-1.257-8.949-9.573-15.216-18.522-13.958-8.949 1.258-15.282 9.583-14.024 18.532l1.24 8.816 6.495-.913-1.239-8.816a9.884 9.884 0 0 1 8.432-11.19 9.884 9.884 0 0 1 11.189 8.432l1.239 8.816M57.547 69.359a2.471 2.471 0 0 1-2.797-2.108l-.8-5.7c-.029-.2-.114-.323-.331-.428-2.459-1.141-3.863-3.918-3.052-6.803.506-1.694 1.787-3.158 3.464-3.732a5.71 5.71 0 0 1 7.667 4.533c.27 1.922-.473 3.852-1.915 5.136-.114.151-.228.302-.2.501l.802 5.7a2.47 2.47 0 0 1-2.108 2.798l-.73.103Z"/>
          <path stroke="#A1A1A1" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" stroke-width="1.5" d="M42.928 20.653c-3.264 3.23-4.884 8.054-4.167 13.158l.457 3.248"/>
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

export const MANUAL_SCREEN_TEMPLATES: Record<string, { title: string; html: string }> = {
  "access-account": {
    title: "Acesse sua conta",
    html: ACCESS_ACCOUNT_HTML,
  },
};
