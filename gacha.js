app.post('/api/gacha', async (req, res) => {
  const { userId } = req.body;

  const startOfDay = new Date().setHours(0, 0, 0, 0);
  const dailyCount = await GachaHistory.countDocuments({
    userId,
    createdAt: { $gte: startOfDay }
  });

  if (dailyCount >= 5) {
    return res.status(422).json({ message: "Batas gacha harian tercapai (Maks 5x)." });
  }

  const availablePrizes = await PrizePool.find({ remainingQuota: { $gt: 0 } });
  
  let prizeWon = null;
  const roll = Math.random();

  if (roll < 0.1 && availablePrizes.length > 0) {
    prizeWon = availablePrizes[Math.floor(Math.random() * availablePrizes.length)];
  }

  if (prizeWon) {
    const update = await PrizePool.updateOne(
      { _id: prizeWon._id, remainingQuota: { $gt: 0 } },
      { $inc: { remainingQuota: -1 } }
    );

    if (update.modifiedCount === 0) prizeWon = null; 
  }

  await GachaHistory.create({
    userId,
    prizeWon: prizeWon ? prizeWon.name : null
  });

  res.json({
    status: "Success",
    result: prizeWon ? `Selamat! Anda menang ${prizeWon.name}` : "Maaf, Anda belum beruntung."
  });
});