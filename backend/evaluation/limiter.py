import asyncio
import time
class LeakyBucketLimiter:
  def __init__(self,rate:float,epsilon:float=0.01):
    self.rate=rate
    self.epsilon=epsilon
    self.interval=1.0/rate
    self.lock=asyncio.Lock()
    self.next_available=time.monotonic()

  async def acquire(self):
    async with self.lock:
      now=time.monotonic()
      wait_time=self.next_available-now
      if wait_time>0:
        await asyncio.sleep(wait_time)
      self.next_available=time.monotonic()+self.interval+self.epsilon

limiter=LeakyBucketLimiter(rate=2.0)