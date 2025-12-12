import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data: tickets, error } = await supabase
      .from('support_tickets_with_user')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[API] Error fetching tickets:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ tickets });
  } catch (error: any) {
    console.error('[API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { ticketId, status, adminNotes } = body;

    if (!ticketId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (adminNotes !== undefined) {
      updateData.admin_notes = adminNotes;
    }

    if (status === 'resolved' || status === 'closed') {
      updateData.resolved_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('support_tickets')
      .update(updateData)
      .eq('id', ticketId)
      .select()
      .single();

    if (error) {
      console.error('[API] Error updating ticket:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ticket: data });
  } catch (error: any) {
    console.error('[API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

