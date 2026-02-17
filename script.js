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

    if (!session) {
        if(elUser) elUser.innerText = "👤 Visitante";
        return; 
    }

    const { data: perfil } = await _supabase.from('perfis').select('*').eq('id', session.user.id).single();
    
    if (perfil) {
        if(elUser) elUser.innerText = "👤 " + session.user.email;
        if (perfil.plano_pro) {
            const expira = new Date(perfil.expira_em);
            const dias = Math.ceil((expira - new Date()) / (1000 * 60 * 60 * 24));
            elCred.innerText = `Assinante PRO ✅ (${dias} dias)`;
            elCred.style.color = "#25D366"; // Verde conforme sua imagem
        } else {
            elCred.innerText = (perfil.creditos_teste || 0) + " créditos";
            elCred.style.color = "#7c3aed";
        }
    }
}

// ==========================================
// 3. GERADOR COM IA (CORREÇÃO DE TEXTO)
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
        
        // Garante que o texto seja exibido corretamente
        inputConteudo.value = typeof contentIA === 'object' ? (contentIA.texto || JSON.stringify(contentIA)) : contentIA;

    } catch (err) { 
        inputConteudo.value = "Erro ao gerar conteúdo. Verifique sua conexão."; 
    } finally {
        btnIA.innerText = "✨ Gerar Planejamento";
        btnIA.disabled = false;
    }
};

// ==========================================
// 4. IMPRIMIR, WHATSAPP E PDF
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

window.zapDireto = () => {
    const msg = encodeURIComponent(`*Sismatic - Plano de Aula*\n\n${inputConteudo.value}`);
    window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
};

window.pdfDireto = () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const texto = doc.splitTextToSize(inputConteudo.value, 180);
    doc.text(texto, 15, 20);
    doc.save("plano_sismatic.pdf");
};

window.limparTela = () => { inputTema.value = ""; inputConteudo.value = ""; };

// Inicialização
verificarAcesso();