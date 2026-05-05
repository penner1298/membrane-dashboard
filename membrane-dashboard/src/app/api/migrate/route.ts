{\rtf1\ansi\ansicpg1252\cocoartf2868
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 import \{ NextResponse \} from "next/server";\
import \{ pool \} from "@/lib/db";\
\
export async function GET() \{\
  try \{\
    // This safely adds the column if it doesn't exist yet\
    await pool.query(`\
      ALTER TABLE tenants \
      ADD COLUMN IF NOT EXISTS has_paid BOOLEAN DEFAULT FALSE;\
    `);\
    \
    return NextResponse.json(\{ message: "Database updated successfully! The has_paid column is live." \});\
  \} catch (error) \{\
    console.error("Migration Error:", error);\
    return NextResponse.json(\{ error: "Failed to update database" \}, \{ status: 500 \});\
  \}\
\}}