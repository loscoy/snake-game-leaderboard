import { Composio } from "composio-core";

const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY,
});

export default async function handler(req, res) {
  try {
    // 设置 CORS 头
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,OPTIONS,PATCH,DELETE,POST,PUT"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
    );

    if (req.method === "OPTIONS") {
      res.status(200).end();
      return;
    }

    // POST：保存分数
    if (req.method === "POST") {
      const { username, score, length, level } = req.body;

      // 验证输入
      if (!username || score === undefined) {
        return res.status(400).json({
          error: "Missing required fields: username, score",
        });
      }

      try {
        const result = await composio.client.actions.execute({
          actionId: "AIRTABLE_CREATE_RECORDS",
          input: {
            baseId: process.env.AIRTABLE_BASE_ID,
            tableIdOrName: "Scores",
            records: [
              {
                fields: {
                  Username: username,
                  Score: parseInt(score),
                  Length: length ? parseInt(length) : 0,
                  Level: level ? parseInt(level) : 1,
                  Timestamp: new Date().toISOString(),
                },
              },
            ],
          },
        });

        return res.status(201).json({
          success: true,
          message: "Score saved successfully",
          data: result,
        });
      } catch (error) {
        console.error("Airtable error:", error);
        return res.status(500).json({
          error: "Failed to save score",
          details: error.message,
        });
      }
    }

    // GET：获取排行榜
    if (req.method === "GET") {
      try {
        const result = await composio.client.actions.execute({
          actionId: "AIRTABLE_LIST_RECORDS",
          input: {
            baseId: process.env.AIRTABLE_BASE_ID,
            tableIdOrName: "Scores",
            sort: [{ field: "Score", direction: "desc" }],
            maxRecords: 100,
          },
        });

        // 格式化返回数据
        const leaderboard = (result.records || []).map((record, index) => ({
          rank: index + 1,
          id: record.id,
          username: record.fields.Username,
          score: record.fields.Score,
          length: record.fields.Length || 0,
          level: record.fields.Level || 1,
          timestamp: record.fields.Timestamp,
        }));

        return res.status(200).json({
          success: true,
          count: leaderboard.length,
          data: leaderboard,
        });
      } catch (error) {
        console.error("Airtable error:", error);
        return res.status(500).json({
          error: "Failed to fetch leaderboard",
          details: error.message,
        });
      }
    }

    // 其他方法不支持
    res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Handler error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
}