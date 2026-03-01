import { NextRequest, NextResponse } from 'next/server';
import { loadConversation, saveConversation, clearConversation } from '@/lib/redis';

// GET - Load conversation history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'pandurang';
    
    const messages = await loadConversation(userId);
    
    return NextResponse.json({
      messages,
      success: true,
    });
  } catch (error: any) {
    console.error('Load conversation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to load conversation',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// POST - Save conversation history
export async function POST(request: NextRequest) {
  try {
    const { userId = 'pandurang', messages } = await request.json();
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }
    
    await saveConversation(userId, messages);
    
    return NextResponse.json({
      success: true,
      count: messages.length,
    });
  } catch (error: any) {
    console.error('Save conversation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to save conversation',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// DELETE - Clear conversation history
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'pandurang';
    
    await clearConversation(userId);
    
    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('Clear conversation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to clear conversation',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
