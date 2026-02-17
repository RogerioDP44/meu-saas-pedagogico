// ==========================================
// 1. CONFIGURAÇÕES E CLIENTE SUPABASE
// ==========================================
const supabaseUrl = 'https://bdlgtweiktdnipvtolfr.supabase.co';
const supabaseKey = 'sb_publishable_IVy8AYPapIr4iijYTwdXNw_tOkrDZEf';
const _supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

const btnIA = document.getElementById('btnIA');
const inputTema = document.getElementById('inputTema');
const inputConteudo = document.getElementById('inputConteudo');

// ==========================================
// 2. VERIFICAÇÃO DE ACESSO (PRO/FREE)
// ==========================================
async function verificarAcesso() {
    const { data: { session } } = await _supabase.auth.getSession();
    const elUser = document.getElementById('userLogado');
    const elCred = document.getElementById('numCreditos');

    if (!session) return;

    const { data: perfil } = await _supabase.from('perfis').select('*').eq('id', session.user.id).single();
    
    if (perfil) {
        if (perfil.plano_pro) {
            const expira = new Date(perfil.expira_em);
            const dias = Math.ceil((expira - new Date()) / (1000 * 60 * 60 * 24));
            elCred.innerText = `Assinante PRO ✅ (${dias} dias)`;
            elCred.style.color = "#25D366"; // Verde das suas imagens
        } else {
            elCred.innerText = (perfil.creditos_teste || 0) + " créditos";
            elCred.style.color = "#7c3aed";
        }
    }
}

// ==========================================
// 3. GERADOR COM IA (CORREÇÃO OBJECT OBJECT)
// ==========================================
window.gerarComIA = async function() {
    const tema = inputTema.value;
    if (!tema) return alert("Digite um tema!");

    btnIA.innerText = "Sismatic gerando... 🧠";
    btnIA.disabled = true;

    try {
        const response = await fetch("/api/gerarPlano", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tema })
        });
        
        const contentIA = await response.json();
        
        // CORREÇÃO: Garante que exibe o texto limpo
        inputConteudo.value = typeof contentIA === 'object' ? (contentIA.texto || JSON.stringify(contentIA)) : contentIA;

    } catch (err) { 
        inputConteudo.value = "Erro na API da OpenAI. Verifique sua chave na Vercel."; 
    } finally {
        btnIA.innerText = "✨ Gerar Planejamento";
        btnIA.disabled = false;
    }
};

// ==========================================
// 4. IMPRIMIR E PAGAMENTO
// ==========================================
window.imprimirDireto = () => {
    const conteudo = inputConteudo.value;
    if (!conteudo || conteudo.includes("[object")) return alert("Gere um plano primeiro!");

    const win = window.open('', '', 'height=700,width=700');
    win.document.write(`
        <html>
            <body style="font-family:sans-serif; padding:40px;">
                <h1 style="color:#7c3aed;">${inputTema.value}</h1>
                <hr>
                <pre style="white-space:pre-wrap; font-size:14px;">${conteudo}</pre>
                <script>window.onload=function(){window.print();window.close();}<\/script>
            </body>
        </html>
    `);
    win.document.close();
};

window.iniciarPagamento = async (plano) => {
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) return window.location.href = "login.html";

    try {
        const response = await fetch("/api/criarPreferencia", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idUsuario: session.user.id, plano: plano })
        });
        const data = await response.json();
        if (data.init_point) window.location.href = data.init_point;
    } catch (e) { alert("Erro ao gerar pagamento."); }
};

verificarAcesso();