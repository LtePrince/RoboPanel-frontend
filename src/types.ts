// Mirrors RoboPanel-backend schema (internal/robot/schema, internal/record/schema).

export interface JointState {
  position: number[]
  velocity: number[]
  effort: number[]
}

export interface CartesianState {
  x: number
  y: number
  z: number
  qx: number
  qy: number
  qz: number
  qw: number
}

export interface BaseState {
  pos_x: number
  pos_y: number
  yaw: number
  vel_x: number
  vel_theta: number
}

export interface NavState {
  nav_status: number
  map_status: number
  power: number
  current_pos_x: number
  current_pos_y: number
  current_angle: number
  busy_status: number
}

export interface RobotState {
  timestamp: number
  arm_connected: boolean
  base_connected: boolean
  joint_state: JointState
  cartesian_state: CartesianState
  base_state: BaseState
  nav_state: NavState
}

export interface DemoFile {
  name: string
  size: number
}

export interface Demo {
  name: string
  created_at: number
  files: DemoFile[]
}

// Generic API envelope: { code, message, data }.
export interface ApiResponse<T> {
  code: string
  message: string
  data?: T
}

export interface RecordStartResp {
  demo_num: number
  demo_dir: string
  pid: number
}

export interface RecordStatusResp {
  running: boolean
  pid?: number
}

export interface DemoListResp {
  demos: Demo[]
  total: number
}
