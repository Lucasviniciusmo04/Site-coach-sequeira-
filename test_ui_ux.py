"""
Suite Automatizada de Testes UI/UX — Portefólio Coach Sequeira
Tecnologias: Python + Playwright + Requests

Testes incluídos:
1. Monitorização da Consola (captura de erros JavaScript e PageErrors)
2. Caça aos Links Mortos (verificação de erro 404 em links internos com requests)
3. Auditoria de Botões Externos e Âncoras (WhatsApp, Google Forms, Redes Sociais e IDs de secções)
4. Teste de Interação UI (botão de idioma #lang-btn e botão Dark Mode onclick="toggleTheme()")
5. Teste de Stress/Spam (50 cliques rápidos consecutivos no botão de idioma + medição de tempo)
6. Emulação Mobile & GSAP (contexto iPhone 13, scroll suave até meio da página e screenshot teste_mobile.png)
"""

import re
import time
from urllib.parse import urljoin, urlparse
import requests
from playwright.sync_api import sync_playwright

# ==============================================================================
# CONFIGURAÇÃO DO AMBIENTE (Alternar entre Live Server Local e GitHub Pages)
# ==============================================================================
# Opção A: Live Server do VS Code (por defeito na porta 5500)
BASE_URL = "http://127.0.0.1:5500/index.html"

# Opção B: GitHub Pages / Netlify (descomentar a linha abaixo quando estiver online)
# BASE_URL = "https://teu-utilizador.github.io/coach-sequeira/index.html"

SCREENSHOT_MOBILE_PATH = "teste_mobile.png"


def is_internal_link(base_url: str, href: str) -> bool:
    """
    Filtra apenas links internos navegáveis (HTML/páginas do projeto),
    ignorando âncoras puras (#), mailto:, tel:, javascript: e domínios externos.
    """
    if not href:
        return False
    href = href.strip()
    if href.startswith(("#", "mailto:", "tel:", "javascript:")):
        return False

    parsed_base = urlparse(base_url)
    full_url = urljoin(base_url, href)
    parsed_target = urlparse(full_url)

    return parsed_base.netloc == parsed_target.netloc


def run_ui_ux_tests():
    print("=" * 72)
    print(" A INICIAR TESTES AUTOMATIZADOS UI/UX — COACH SEQUEIRA")
    print(f" URL Alvo: {BASE_URL}")
    print("=" * 72)

    console_errors = []
    page_exceptions = []

    with sync_playwright() as p:
        # Lançar browser Chromium (muda headless=False se quiseres ver o browser a abrir)
        browser = p.chromium.launch(headless=True)

        # ======================================================================
        # CONTEXTO DESKTOP (Testes 1 a 5)
        # ======================================================================
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        # Listeners para capturar erros de consola e exceções de JavaScript
        page.on(
            "console",
            lambda msg: console_errors.append(msg.text)
            if msg.type == "error"
            else None,
        )
        page.on("pageerror", lambda exc: page_exceptions.append(str(exc)))

        # ----------------------------------------------------------------------
        # 1. MONITORIZAÇÃO DA CONSOLA (Abertura da Página Inicial)
        # ----------------------------------------------------------------------
        print("\n[1/6] A testar abertura da página e monitorização da consola...")
        try:
            response = page.goto(BASE_URL, wait_until="networkidle", timeout=15000)
            status = response.status if response else "Desconhecido"
            print(f"  -> Página carregada (HTTP Status: {status})")
        except Exception as e:
            print(f"  [ERRO CRÍTICO] Não foi possível abrir {BASE_URL}: {e}")
            print("  -> Verifica se o teu Live Server está ativo antes de correr o script.")
            browser.close()
            return

        if not console_errors and not page_exceptions:
            print("  [OK] Zero erros de JavaScript na consola durante o carregamento.")
        else:
            print("  [ALERTA] Foram detetados erros na consola:")
            for err in console_errors + page_exceptions:
                print(f"     - {err}")

        # ----------------------------------------------------------------------
        # 2. CAÇA AOS LINKS MORTOS (404) COM A BIBLIOTECA REQUESTS
        # ----------------------------------------------------------------------
        print("\n[2/6] A procurar links internos e a testar erros 404 (via requests)...")
        raw_hrefs = page.eval_on_selector_all(
            "a[href]", "elements => elements.map(el => el.getAttribute('href'))"
        )

        # Construir conjunto de URLs internos únicos (sem a parte #ancora)
        internal_urls = set()
        for href in raw_hrefs:
            if is_internal_link(BASE_URL, href):
                clean_url = urljoin(BASE_URL, href).split("#")[0]
                internal_urls.add(clean_url)

        broken_links = []
        for url in sorted(internal_urls):
            try:
                req_resp = requests.get(url, timeout=8)
                if req_resp.status_code == 404:
                    broken_links.append((url, 404))
                    print(f"  [404 NÃO ENCONTRADO] {url}")
                elif req_resp.status_code >= 400:
                    broken_links.append((url, req_resp.status_code))
                    print(f"  [ERRO HTTP {req_resp.status_code}] {url}")
                else:
                    print(f"  [OK {req_resp.status_code}] {url}")
            except requests.RequestException as req_err:
                broken_links.append((url, str(req_err)))
                print(f"  [FALHA DE LIGAÇÃO] {url} -> {req_err}")

        if not broken_links:
            print(f"  [OK] Todos os {len(internal_urls)} links internos estão operacionais (0 erros 404).")
        else:
            print(f"  [FALHA] Foram encontrados {len(broken_links)} links internos com problemas.")

        # ----------------------------------------------------------------------
        # 3. AUDITORIA DE WHATSAPP, GOOGLE FORMS, REDES SOCIAIS E ÂNCORAS
        # ----------------------------------------------------------------------
        print("\n[3/6] A auditar botões de WhatsApp, Google Forms, Redes Sociais e Âncoras...")
        all_links = page.eval_on_selector_all(
            "a",
            """elements => elements.map(el => ({
                text: (el.innerText || el.getAttribute('aria-label') || el.getAttribute('title') || 'Ícone/Botão sem texto').trim().replace(/\\s+/g, ' '),
                href: (el.getAttribute('href') || '').trim(),
                target: (el.getAttribute('target') || '').trim()
            }))""",
        )

        social_domains = [
            "instagram.com",
            "linkedin.com",
            "facebook.com",
            "youtube.com",
            "tiktok.com",
            "x.com",
            "twitter.com",
        ]
        fake_numbers = ["99999999", "00000000", "12345678", "11111111"]
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0"
        }
        external_issues = 0

        for link in all_links:
            text = link["text"][:32]
            href = link["href"]
            target = link["target"]

            # 3.1 Detetar links vazios ou esquecidos apenas com '#'
            if href in ["", "#"]:
                print(f"  [ALERTA LINK VAZIO] '{text}' tem href='{href}' (não leva a lado nenhum).")
                external_issues += 1
                continue

            # 3.2 Verificar se âncoras internas (ex: #servicos) existem mesmo no HTML
            if href.startswith("#") and len(href) > 1:
                anchor_id = href[1:]
                exists = page. evaluate(
                    "(id) => document.getElementById(id) !== null", anchor_id
                )
                if not exists:
                    print(f"  [ERRO ÂNCORA] '{text}' aponta para '{href}', mas não existe id='{anchor_id}' na página.")
                    external_issues += 1
                else:
                    print(f"  [OK ÂNCORA] '{text}' -> rola para a secção '{href}'")
                continue

            # 3.3 Validar botões de WhatsApp
            if "wa.me" in href.lower() or "whatsapp.com" in href.lower():
                digits = "".join(re.findall(r"\d+", href))
                is_fake = any(fake in digits for fake in fake_numbers)
                if len(digits) < 11 or is_fake:
                    print(f"  [ERRO WHATSAPP] '{text}' tem número inválido ou fictício: {href}")
                    external_issues += 1
                else:
                    if target != "_blank":
                        print(f"  [AVISO UX] WhatsApp '{text}' ({digits[:15]}) funciona, mas falta target='_blank'.")
                    else:
                        print(f"  [OK WHATSAPP] '{text}' -> Número válido ({digits[:15]}) e abre em nova aba.")

            # 3.4 Validar botão do Google Forms
            elif "docs.google.com/forms" in href.lower() or "forms.gle" in href.lower():
                try:
                    resp = requests.get(href, headers=headers, timeout=8, allow_redirects=True)
                    if "accounts.google.com" in resp.url:
                        print(f"  [ERRO GOOGLE FORMS] '{text}' exige login! Liberta o acesso público no Forms.")
                        external_issues += 1
                    elif resp.status_code == 200:
                        if target != "_blank":
                            print(f"  [AVISO UX] Google Forms '{text}' está público, mas falta target='_blank'.")
                        else:
                            print(f"  [OK GOOGLE FORMS] '{text}' está público, acessível e abre em nova aba.")
                    else:
                        print(f"  [ERRO GOOGLE FORMS] Status HTTP {resp.status_code} em {href}")
                        external_issues += 1
                except requests.RequestException as e:
                    print(f"  [FALHA GOOGLE FORMS] Não foi possível testar {href}: {e}")
                    external_issues += 1

            # 3.5 Validar Redes Sociais
            elif any(domain in href.lower() for domain in social_domains):
                parsed = urlparse(href)
                if parsed.path in ["", "/"]:
                    print(f"  [ERRO REDE SOCIAL] '{text}' aponta apenas para a página inicial ({href}), falta o perfil!")
                    external_issues += 1
                else:
                    if target != "_blank":
                        print(f"  [AVISO UX] Rede social '{text}' ({href}) não tem target='_blank'.")
                    else:
                        print(f"  [OK REDE SOCIAL] '{text}' -> {href} (abre em nova aba)")

        if external_issues == 0:
            print("  [OK] Todos os botões de WhatsApp, Google Forms, Redes Sociais e Âncoras estão perfeitos!")
        else:
            print(f"  [ATENÇÃO] Foram encontrados {external_issues} problemas em botões/links para corrigir.")

        # ----------------------------------------------------------------------
        # 4. TESTE DE INTERAÇÃO UI (Idioma #lang-btn e Tema onclick="toggleTheme()")
        # ----------------------------------------------------------------------
        print("\n[4/6] A testar interações de UI (Idioma e Modo Escuro)...")
        errors_before_ui = len(console_errors) + len(page_exceptions)

        # 4.1 Botão de Idioma (#lang-btn)
        lang_btn = page.locator("#lang-btn")
        lang_btn.wait_for(state="visible", timeout=5000)
        initial_lang_text = lang_btn.inner_text().strip()
        lang_btn.click()
        after_lang_text = lang_btn.inner_text().strip()
        print(f"  -> Botão de idioma (#lang-btn) clicado: '{initial_lang_text}' -> '{after_lang_text}'")

        # 4.2 Botão de Modo Escuro (onclick="toggleTheme()")
        theme_btn = page.locator('button[onclick="toggleTheme()"]')
        theme_btn.wait_for(state="visible", timeout=5000)
        had_dark_before = page.evaluate("document.documentElement.classList.contains('dark')")
        theme_btn.click()
        has_dark_after = page.evaluate("document.documentElement.classList.contains('dark')")
        print(f"  -> Botão Dark Mode (onclick=\"toggleTheme()\") clicado: classe 'dark' {had_dark_before} -> {has_dark_after}")

        errors_after_ui = len(console_errors) + len(page_exceptions)
        if errors_after_ui == errors_before_ui and had_dark_before != has_dark_after:
            print("  [OK] Interações de Idioma e Tema executadas sem quebrar o JavaScript.")
        else:
            print("  [ALERTA] Verifica o comportamento das funções toggleLanguage() / toggleTheme().")

        # ----------------------------------------------------------------------
        # 5. TESTE DE STRESS / SPAM (50 cliques rápidos no botão #lang-btn)
        # ----------------------------------------------------------------------
        print("\n[5/6] A executar Teste de Stress/Spam (50 cliques rápidos em #lang-btn)...")
        errors_before_spam = len(console_errors) + len(page_exceptions)

        start_time = time.perf_counter()
        for _ in range(50):
            lang_btn.click(delay=0, timeout=3000)
        elapsed_time = time.perf_counter() - start_time
        avg_click_ms = (elapsed_time / 50) * 1000

        # Verificar se a página continua responsiva avaliando uma expressão no DOM
        is_responsive = page.evaluate("() => document.readyState === 'complete'")
        errors_after_spam = len(console_errors) + len(page_exceptions)

        print(f"  -> 50 cliques concluídos em {elapsed_time:.3f} segundos (média: {avg_click_ms:.2f} ms/clique).")
        if is_responsive and errors_after_spam == errors_before_spam:
            print("  [OK] A página manteve-se 100% responsiva, sem congelar e sem erros na consola.")
        else:
            print("  [FALHA] Foram detetados erros ou lentidão anormal durante o teste de stress.")

        context.close()

        # ======================================================================
        # 6. EMULAÇÃO MOBILE (iPhone 13) & ANIMAÇÕES GSAP + SCREENSHOT
        # ======================================================================
        print("\n[6/6] A iniciar Emulação Mobile (iPhone 13) e ativação de animações GSAP...")
        iphone_13 = p.devices["iPhone 13"]
        mobile_context = browser.new_context(**iphone_13)
        mobile_page = mobile_context.new_page()

        mobile_page.goto(BASE_URL, wait_until="networkidle", timeout=15000)

        # Scroll suave passo a passo até ao meio da página para acionar o GSAP ScrollTrigger
        mobile_page.evaluate(
            """
            async () => {
                const targetY = document.body.scrollHeight / 2;
                const step = targetY / 15;
                for (let y = 0; y <= targetY; y += step) {
                    window.scrollTo({ top: y, behavior: 'smooth' });
                    await new Promise(resolve => setTimeout(resolve, 80));
                }
            }
            """
        )

        # Aguardar que o GSAP estabilize as animações após o scroll
        mobile_page.wait_for_timeout(1000)

        # Guardar captura de ecrã mobile
        mobile_page.screenshot(path=SCREENSHOT_MOBILE_PATH, full_page=False)
        print(f"  [OK] Scroll suave concluído e screenshot guardado em: '{SCREENSHOT_MOBILE_PATH}'")

        mobile_context.close()
        browser.close()

    # ==========================================================================
    # RESUMO FINAL
    # ==========================================================================
    print("\n" + "=" * 72)
    print(" RESUMO DA EXECUÇÃO")
    print("=" * 72)
    print(f" • Erros de Consola / JS   : {len(console_errors) + len(page_exceptions)}")
    print(f" • Links Internos 404      : {len(broken_links)}")
    print(f" • Problemas Botões/Redes  : {external_issues}")
    print(f" • Tempo Stress (50x)      : {elapsed_time:.3f}s")
    print(f" • Screenshot Mobile       : {SCREENSHOT_MOBILE_PATH}")
    print("=" * 72)


if __name__ == "__main__":
    run_ui_ux_tests()

