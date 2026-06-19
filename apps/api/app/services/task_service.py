import grpc
from google.protobuf import empty_pb2

from app.models.task import SessionLocal, TaskModel
from app.proto import task_pb2, task_pb2_grpc


def _to_proto(task: TaskModel) -> task_pb2.Task:
    return task_pb2.Task(id=task.id, title=task.title, completed=task.completed)


class TaskServiceServicer(task_pb2_grpc.TaskServiceServicer):
    def CreateTask(self, request: task_pb2.CreateTaskRequest, context: grpc.ServicerContext) -> task_pb2.Task:
        if not request.title.strip():
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, "title must not be empty")

        db = SessionLocal()
        try:
            task = TaskModel(title=request.title, completed=False)
            db.add(task)
            db.commit()
            db.refresh(task)
            return _to_proto(task)
        finally:
            db.close()

    def ListTasks(
        self, request: task_pb2.ListTasksRequest, context: grpc.ServicerContext
    ) -> task_pb2.ListTasksResponse:
        db = SessionLocal()
        try:
            tasks = db.query(TaskModel).all()
            return task_pb2.ListTasksResponse(tasks=[_to_proto(t) for t in tasks])
        finally:
            db.close()

    def CompleteTask(self, request: task_pb2.CompleteTaskRequest, context: grpc.ServicerContext) -> task_pb2.Task:
        db = SessionLocal()
        try:
            task = db.query(TaskModel).filter(TaskModel.id == request.id).first()
            if task is None:
                context.abort(grpc.StatusCode.NOT_FOUND, f"task {request.id} not found")
            task.completed = True
            db.commit()
            db.refresh(task)
            return _to_proto(task)
        finally:
            db.close()

    def DeleteTask(
        self, request: task_pb2.DeleteTaskRequest, context: grpc.ServicerContext
    ) -> empty_pb2.Empty:
        db = SessionLocal()
        try:
            task = db.query(TaskModel).filter(TaskModel.id == request.id).first()
            if task is None:
                context.abort(grpc.StatusCode.NOT_FOUND, f"task {request.id} not found")
            db.delete(task)
            db.commit()
            return empty_pb2.Empty()
        finally:
            db.close()
