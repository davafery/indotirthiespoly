import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { reduceRoom } from './rooms.js';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { roomId, op, args } = await req.json();

    // Fetch room dengan Optimistic Lock
    const { data: roomRow } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (!roomRow) {
      return new Response(JSON.stringify({ error: 'Room not found' }), { status: 404 });
    }

    const updatedRoom = reduceRoom(roomRow.data, user.id, op, args);

    // Compare and Set (CAS) ver
    const { error: updateError } = await supabase
      .from('rooms')
      .update({
        data: updatedRoom,
        ver: updatedRoom.ver,
        updated_at: new Date()
      })
      .eq('id', roomId)
      .eq('ver', roomRow.ver);

    if (updateError) {
      return new Response(JSON.stringify({ error: 'Bentrok versi, silakan coba lagi' }), { status: 409 });
    }

    return new Response(JSON.stringify({ room: updatedRoom }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
