# AI Quiz App - Serverless Deployment Guide

This application has been converted to a serverless architecture compatible with Vercel deployment while maintaining all original functionality.

## Architecture Overview

The application now uses:
- **Frontend**: React with Vite (unchanged)
- **Backend**: Serverless functions in `/api` folder
- **Database**: Neon PostgreSQL (unchanged)
- **Deployment**: Vercel

## Project Structure

```
AIQuizApp/
├── api/                          # Serverless API functions
│   ├── questions.ts             # GET /api/questions
│   ├── quiz-sessions.ts         # POST /api/quiz-sessions
│   ├── quiz-sessions/
│   │   ├── [id].ts             # GET/PATCH /api/quiz-sessions/{id}
│   │   └── [id]/
│   │       └── submit.ts       # POST /api/quiz-sessions/{id}/submit
│   ├── ai/
│   │   └── chat.ts             # POST /api/ai/chat
│   └── quiz-results/
│       └── session/
│           └── [sessionId].ts  # GET /api/quiz-results/session/{sessionId}
├── lib/                         # Shared utilities
│   ├── storage.ts              # Database operations
│   ├── aiService.ts            # OpenAI integration
│   ├── reportService.ts        # PDF generation & email
│   └── db.ts                   # Database connection
├── client/                      # React frontend (unchanged)
├── shared/                      # Shared types (unchanged)
└── attached_assets/             # Static assets
```

## Environment Variables

Set these in your Vercel dashboard or `.env` file:

```env
# Database
DATABASE_URL=your_neon_database_url

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=your_email@gmail.com
```

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env`

3. Run database migrations:
```bash
npm run db:push
```

4. Start development server:
```bash
npm run dev
```

For API testing, you can also run:
```bash
npm run dev:api
```

## Deployment to Vercel

### Option 1: Vercel CLI (Recommended)

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

4. Set environment variables in Vercel dashboard

### Option 2: GitHub Integration

1. Push code to GitHub repository
2. Connect repository to Vercel
3. Configure environment variables
4. Deploy automatically on push

## API Endpoints

All endpoints maintain the same functionality as the original Express server:

- `GET /api/questions` - Get all questions or filter by category
- `POST /api/quiz-sessions` - Create new quiz session
- `GET /api/quiz-sessions/{id}` - Get quiz session by ID
- `PATCH /api/quiz-sessions/{id}` - Update quiz session
- `POST /api/quiz-sessions/{id}/submit` - Submit quiz and generate report
- `POST /api/ai/chat` - AI chat functionality
- `GET /api/quiz-results/session/{sessionId}` - Get results by session

## Key Changes Made

1. **Converted Express routes to serverless functions**
   - Each route is now a separate file in `/api`
   - Uses Vercel's serverless function format

2. **Updated imports and utilities**
   - Moved shared code to `/lib` folder
   - Updated database connection for serverless

3. **Modified build configuration**
   - Updated `vercel.json` for serverless deployment
   - Updated `vite.config.ts` for proper build output

4. **Maintained all functionality**
   - User registration flow ✓
   - Quiz assessment ✓
   - Score calculation ✓
   - AI efficiency scoring ✓
   - PDF report generation ✓
   - Email delivery ✓

## Performance Considerations

- Functions have a 60-second timeout for report generation
- Cold starts may add 1-2 seconds on first request
- Database connections are optimized for serverless
- PDF generation uses headless Chrome in serverless environment

## Troubleshooting

### Common Issues:

1. **Database connection errors**
   - Ensure `DATABASE_URL` is set correctly
   - Check Neon database is accessible

2. **Email delivery issues**
   - Verify SMTP credentials
   - Check Gmail app password if using Gmail

3. **PDF generation failures**
   - Puppeteer may need additional configuration for some hosting
   - Check function timeout limits

4. **Cold start timeouts**
   - First request after idle may take longer
   - Consider using Vercel Pro for better performance

## Migration Notes

- All original functionality is preserved
- Database schema remains unchanged
- Frontend code requires no modifications
- Environment variables need to be reconfigured for Vercel

## Support

If you encounter issues during deployment, check:
1. Vercel function logs
2. Environment variable configuration
3. Database connectivity
4. SMTP settings for email delivery 