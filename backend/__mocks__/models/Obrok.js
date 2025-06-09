module.exports = {
  find: jest.fn(() => Promise.resolve([
    {
      name: "Test obrok",
      userEmail: "test@mail.com",
      calories: 100,
      protein: 10,
      locX: 15.5,
      locY: 46.5,
      timestamp: new Date().toISOString(),
      obrokId: "mock-id-123"
    }
  ]))
};