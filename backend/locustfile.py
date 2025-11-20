from locust import HttpUser, task, between


class GatewayLoadTest(HttpUser):
    wait_time = between(0.1, 0.3)

    @task
    def send_request(self):
        payload = {
            "value": 123,     # Whatever your backend expects
            "msg": "hello",
        }
        self.client.post("/process", json=payload)
