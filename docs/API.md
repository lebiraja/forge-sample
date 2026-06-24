# API Documentation

## Chat Endpoint

### POST `/api/chat`
Provides writing assistance using GPT-OSS 20B via the Groq API.

#### Authentication
- Requires active NextAuth session (`session.user.id`).
- Returns `401 Unauthorized` if not authenticated.

#### Request Body
```json
{
  "messages": [
    {
      "role": "user",
      "content": "How do I write a good README?"
    }
  ]
}
```

#### Response (Success - 200 OK)
```json
{
  "content": "Here are the tips..."
}
```

#### Response (Error - 502 Bad Gateway)
```json
{
  "error": "AI request failed"
}
```
