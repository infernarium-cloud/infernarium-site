export default {
  async fetch(request, env) {
    // Configuração global de cabeçalhos CORS para reutilização
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };

    // Resposta para a requisição de pré-visualização (Preflight CORS)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders
      });
    }

    if (request.method === 'POST') {
      try {
        const { email } = await request.json();

        if (!email) {
          return new Response(JSON.stringify({ error: 'Email é obrigatório.' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        // Coleta o IP direto da rede da Cloudflare e gera o timestamp no servidor (Mais seguro)
        const ip = request.headers.get('CF-Connecting-IP') || 'IP não detectado';
        const timestamp = new Date().toISOString();
        
        // Salva no KV (Certifique-se de que o KV namespace SUBSCRIBERS está vinculado no wrangler.jsonc)
        await env.SUBSCRIBERS.put(email, JSON.stringify({ ip, timestamp }));
        
        // Retorno de sucesso com os cabeçalhos CORS inclusos
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (err) {
        return new Response(JSON.stringify({ error: 'Formato JSON inválido.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Se não for OPTIONS nem POST, bloqueia o método
    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders
    });
  }
}