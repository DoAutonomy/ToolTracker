import { NextResponse } from "next/server";
import { supabase } from "@/app/supabase-client";


export async function GET(req: Request) {
  try {

    // const { data, error } = await supabase
    //     .from('jobs')
    //     .select('')



    // return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("[/api/get-data] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}