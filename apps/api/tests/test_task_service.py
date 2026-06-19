import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import app.models.task as task_module
from app.models.task import Base, TaskModel
from app.proto import task_pb2
from app.services.task_service import TaskServiceServicer


class FakeContext:
    """Minimal stand-in for grpc.ServicerContext, just enough for abort()."""

    def abort(self, code, details):
        raise RuntimeError(f"{code}: {details}")


@pytest.fixture(autouse=True)
def in_memory_db(monkeypatch):
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    TestSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    monkeypatch.setattr(task_module, "SessionLocal", TestSession)
    monkeypatch.setattr("app.services.task_service.SessionLocal", TestSession)
    yield


def test_create_task_returns_task_with_id():
    servicer = TaskServiceServicer()
    response = servicer.CreateTask(task_pb2.CreateTaskRequest(title="Write tests"), FakeContext())

    assert response.id > 0
    assert response.title == "Write tests"
    assert response.completed is False


def test_create_task_rejects_empty_title():
    servicer = TaskServiceServicer()
    with pytest.raises(RuntimeError, match="INVALID_ARGUMENT"):
        servicer.CreateTask(task_pb2.CreateTaskRequest(title="   "), FakeContext())


def test_list_tasks_returns_created_tasks():
    servicer = TaskServiceServicer()
    servicer.CreateTask(task_pb2.CreateTaskRequest(title="Task A"), FakeContext())
    servicer.CreateTask(task_pb2.CreateTaskRequest(title="Task B"), FakeContext())

    response = servicer.ListTasks(task_pb2.ListTasksRequest(), FakeContext())

    assert [t.title for t in response.tasks] == ["Task A", "Task B"]


def test_complete_task_marks_completed():
    servicer = TaskServiceServicer()
    created = servicer.CreateTask(task_pb2.CreateTaskRequest(title="Finish me"), FakeContext())

    completed = servicer.CompleteTask(task_pb2.CompleteTaskRequest(id=created.id), FakeContext())

    assert completed.completed is True


def test_complete_task_missing_id_raises_not_found():
    servicer = TaskServiceServicer()
    with pytest.raises(RuntimeError, match="NOT_FOUND"):
        servicer.CompleteTask(task_pb2.CompleteTaskRequest(id=9999), FakeContext())
