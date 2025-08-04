import { NextRequest, NextResponse } from 'next/server';

// Simuler l'envoi d'email (à remplacer par nodemailer, resend, ou sendgrid en production)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, toName, subject, message, from, data } = body;
    
    // Validation basique
    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: 'Paramètres manquants' },
        { status: 400 }
      );
    }
    
    // En production, vous utiliseriez un service comme :
    // - Nodemailer avec SMTP
    // - Resend
    // - SendGrid
    // - Postmark
    
    // Pour l'instant, on simule l'envoi et on log
    console.log('📧 API Email Route - Envoi simulé');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Message:', message);
    
    // Stocker dans un fichier de log ou base de données
    const emailLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      to,
      toName,
      subject,
      message,
      from: from || 'noreply@fadju.sn',
      data,
      status: 'sent',
      provider: 'api-mock'
    };
    
    // En développement, on peut stocker dans un cookie ou retourner dans la réponse
    return NextResponse.json({
      success: true,
      message: 'Email envoyé avec succès (mode simulation)',
      log: emailLog
    });
    
  } catch (error) {
    console.error('Erreur API email:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi de l\'email' },
      { status: 500 }
    );
  }
}

// Endpoint pour récupérer les logs d'emails (utile pour debug)
export async function GET(request: NextRequest) {
  // En production, protéger cet endpoint
  return NextResponse.json({
    message: 'Email API endpoint',
    status: 'operational',
    provider: 'mock',
    configuration: {
      ready: true,
      provider: process.env.EMAIL_PROVIDER || 'console'
    }
  });
}