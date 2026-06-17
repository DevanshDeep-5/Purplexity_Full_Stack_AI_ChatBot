import express from "express";
import { tavily } from "@tavily/core";
import OpenAI from "openai";
import { SYSTEM_PROMPT, PROMPT_TEMPLATE } from "./prompt";
import { prisma } from "./db";
import { middleware } from "./middleware";
import cors from "cors"

const app = express();
const client = tavily({ apiKey: process.env.TAVILY_API_KEY });

const openRouterClient = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

app.use(express.json())
app.use(cors())

app.get("/conversations", middleware, async (req, res) => {
    const conversations = await prisma.conversation.findMany({
        where: { userId: req.userId },
        orderBy: { id: "desc" },
        select: {
            id: true,
            title: true,
            slug: true,
        }
    })
    res.json({ conversations })
})

app.get("/conversation/:conversation_id", middleware, async (req, res) => {
    const conversation = await prisma.conversation.findFirst({
        where: {
            id: req.params.conversation_id as string,
            userId: req.userId!,
        },
        include: {
            messages: {
                orderBy: { createdAt: "asc" }
            }
        }
    })

    if (!conversation) {
        res.status(404).json({ message: "Conversation not found" })
        return;
    }

    res.json({ conversation })
})

app.post("/purplexity_ask", middleware, async (req, res) => {
    const query = req.body.query as string;

    if (!query) {
        res.status(400).json({ message: "query is required" })
        return;
    }

    const webSearchResponse = await client.search(query, {
        searchDepth: "advanced"
    })
    const webSearchResults = webSearchResponse.results;

    const prompt = PROMPT_TEMPLATE
        .replace("{{WEB_SEARCH_RESULTS}}", JSON.stringify(webSearchResults))
        .replace("{{USER_QUERY}}", query);

    const result = await openRouterClient.chat.completions.create({
        model: "openrouter/free",
        messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: prompt }
        ],
        stream: true,
    });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let fullResponse = "";

    for await (const chunk of result) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
            fullResponse += content;
            res.write(content);
        }
    }

    const sources = webSearchResults.map(r => ({ url: r.url }));

    res.write("\n<SOURCES>\n");
    res.write(JSON.stringify(sources));
    res.write("\n</SOURCES>\n");

    res.end();

    const slug = query.toLowerCase().replace(/\s+/g, "-").slice(0, 60)
    const title = query.slice(0, 100)

    const conversation = await prisma.conversation.create({
        data: {
            userId: req.userId!,
            slug,
            title,
            messages: {
                create: [
                    { role: "User", content: query },
                    { role: "Assistant", content: fullResponse },
                ]
            }
        }
    })

    console.log("Created conversation:", conversation.id)
})

app.post("/purplexity_ask/follow_up", middleware, async (req, res) => {
    const { conversation_id, query } = req.body as { conversation_id: string, query: string }

    if (!conversation_id || !query) {
        res.status(400).json({ message: "conversation_id and query are required" })
        return;
    }

    const conversation = await prisma.conversation.findFirst({
        where: { id: conversation_id, userId: req.userId! },
        include: {
            messages: { orderBy: { createdAt: "asc" } }
        }
    })

    if (!conversation) {
        res.status(404).json({ message: "Conversation not found" })
        return;
    }

    const webSearchResponse = await client.search(query, {
        searchDepth: "advanced"
    })
    const webSearchResults = webSearchResponse.results;

    const followUpPrompt = PROMPT_TEMPLATE
        .replace("{{WEB_SEARCH_RESULTS}}", JSON.stringify(webSearchResults))
        .replace("{{USER_QUERY}}", query);

    const history = conversation.messages.map(msg => ({
        role: msg.role === "User" ? "user" as const : "assistant" as const,
        content: msg.content,
    }))

    const result = await openRouterClient.chat.completions.create({
        model: "openrouter/free",
        messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...history,
            { role: "user", content: followUpPrompt }
        ],
        stream: true,
    });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let fullResponse = "";

    for await (const chunk of result) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
            fullResponse += content;
            res.write(content);
        }
    }

    const sources = webSearchResults.map(r => ({ url: r.url }));

    res.write("\n<SOURCES>\n");
    res.write(JSON.stringify(sources));
    res.write("\n</SOURCES>\n");

    res.end();

    await prisma.message.createMany({
        data: [
            { role: "User", content: query, conversationId: conversation_id },
            { role: "Assistant", content: fullResponse, conversationId: conversation_id },
        ]
    })
})

app.listen(3001, () => {
    console.log("Server running on port 3001")
})