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
// 2. VERIFICAÇÃO DE ACESSO (PRO)
// ==========================================
async function verificarAcesso() {
    const { data: { session } } = await _supabase.auth.getSession();
    const elUser = document.getElementById('userLogado');
    const elCred = document.getElementById('numCreditos');

    if (!session) return;

    const { data: perfil } = await _supabase.from('perfis').select('*').eq('id', session.user.id).single();
    
    if (perfil && perfil.plano_pro) {
        const expira = new Date(perfil.expira_em);
        const dias = Math.ceil((expira - new Date()) / (1000 * 60 * 60 * 24));
        elCred.innerText = `Assinante PRO ✅ (${dias} dias)`;
        elCred.style.color = "#25D366"; // Verde conforme sua imagem
    }
}

// ==========================================
// 3. GERADOR COM IA (CORREÇÃO DE ERRO)
// ==========================================
window.gerarComIA = async function() {
    const tema = inputTema.value;
    if (!tema) return alert("Por favor, digite um tema!");

    btnIA.innerText = "Sismatic gerando... 🧠";
    btnIA.disabled = true;
    inputConteudo.value = "Gerando seu plano de aula...";

    try {
        const response = await fetch("/api/gerarPlano", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tema })
        });
        
        const resultado = await response.json();

        if (response.ok) {
            // CORREÇÃO: Exibe apenas o texto, eliminando o [object Object]
            inputConteudo.value = typeof resultado === 'string' ? resultado : JSON.stringify(resultado);
        } else {
            inputConteudo.value = "Erro: " + (resultado.error || "Verifique a chave na Vercel.");
        }
    } catch (err) { 
        inputConteudo.value = "Erro de conexão com o servidor."; 
    } finally {
        btnIA.innerText = "✨ Gerar Planejamento";
        btnIA.disabled = false;
    }
};

// ==========================================
// 4. BOTÃO DE IMPRIMIR
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

verificarAcesso();