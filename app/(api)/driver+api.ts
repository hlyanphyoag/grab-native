import { neon } from "@neondatabase/serverless";

export async function GET(){
    // console.log("Hello Driver")
    try{
        const sql  = neon(`${process.env.DATABASE_URL}`);
        const response = await sql`SELECT * FROM drivers`;
        console.log("Dr response:", response)
        return Response.json({data:response})
    }catch(error){
        console.log(error);
        return new Response(
            JSON.stringify({
                error: error
            })
        )
    }
}