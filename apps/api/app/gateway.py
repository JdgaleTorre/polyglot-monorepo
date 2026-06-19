"""
Thin HTTP/JSON gateway in front of the gRPC TaskService.

Browsers can't speak raw gRPC (HTTP/2 trailers aren't exposed to fetch/XHR),
so real-world setups front a gRPC backend with either:
  (a) grpc-web + Envoy, or
  (b) a small BFF/gateway like this one.

This keeps the practice repo dependency-light while still exercising the
real gRPC service underneath — the React client only ever talks JSON.
"""

import grpc
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.proto import task_pb2, task_pb2_grpc

app = FastAPI(title="Task Gateway")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_stub() -> task_pb2_grpc.TaskServiceStub:
    channel = grpc.insecure_channel("localhost:50051")
    return task_pb2_grpc.TaskServiceStub(channel)


class CreateTaskBody(BaseModel):
    title: str


def _task_to_dict(task: task_pb2.Task) -> dict:
    return {"id": task.id, "title": task.title, "completed": task.completed}


@app.get("/tasks")
def list_tasks():
    stub = get_stub()
    response = stub.ListTasks(task_pb2.ListTasksRequest())
    return {"tasks": [_task_to_dict(t) for t in response.tasks]}


@app.post("/tasks")
def create_task(body: CreateTaskBody):
    stub = get_stub()
    try:
        task = stub.CreateTask(task_pb2.CreateTaskRequest(title=body.title))
    except grpc.RpcError as e:
        raise HTTPException(status_code=400, detail=e.details())
    return _task_to_dict(task)


@app.post("/tasks/{task_id}/complete")
def complete_task(task_id: int):
    stub = get_stub()
    try:
        task = stub.CompleteTask(task_pb2.CompleteTaskRequest(id=task_id))
    except grpc.RpcError as e:
        raise HTTPException(status_code=404, detail=e.details())
    return _task_to_dict(task)
