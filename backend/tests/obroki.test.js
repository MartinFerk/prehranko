jest.setTimeout(20000);
const request = require('supertest');
const mongoose = require('mongoose');
const { app, server } = require('../server'); // poskrbi, da je to pravilna pot
const Obrok = require('../models/Obrok');

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  // Izbriši obstoječe z istim obrokId
  await Obrok.deleteMany({ obrokId: 'test-obrok-id' });

  // Dodaj testni obrok
  await Obrok.create({
    obrokId: 'test-obrok-id',
    userEmail: 'test@example.com',
    calories: 200,
    protein: 15,
    name: 'Test Obrok'
  });
});

afterAll(async () => {
  await mongoose.connection.close();
  if (server && server.close) {
    server.close();
  }
});

describe('API testi - Obroki', () => {
  it('vrne vse obroke', async () => {
    const res = await request(app).get('/api/obroki');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});
