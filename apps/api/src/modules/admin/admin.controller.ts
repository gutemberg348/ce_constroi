import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { UserRole } from "@/generated/prisma/enums";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Roles } from "@/common/decorators/roles.decorator";
import { CreateProjectImageDto } from "@/modules/project-images/dto/create-project-image.dto";
import { CreateTerrainImageDto } from "@/modules/terrain-images/dto/create-terrain-image.dto";
import { UpdateProjectDto } from "@/modules/projects/dto/update-project.dto";
import { UpdateTerrainDto } from "@/modules/terrains/dto/update-terrain.dto";
import { AdminService } from "./admin.service";
import { ListAdminResourcesDto } from "./dto/list-admin-resources.dto";
import { ListArchitectsDto } from "./dto/list-architects.dto";
import { RejectArchitectDto } from "./dto/reject-architect.dto";
import { UpdateAdminArchitectDto } from "./dto/update-admin-architect.dto";
import { UpdateAdminStatusDto } from "./dto/update-admin-status.dto";
import { UpdateAdminUserDto } from "./dto/update-admin-user.dto";

@ApiTags("admin")
@ApiBearerAuth()
@Controller("admin")
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("metrics")
  metrics() {
    return this.adminService.metrics();
  }

  @Get("overview")
  overview() {
    return this.adminService.overview();
  }

  @Get("architects")
  architects(@Query() query: ListArchitectsDto) {
    return this.adminService.listArchitects(query);
  }

  @Get("users")
  users(@Query() query: ListAdminResourcesDto) {
    return this.adminService.listUsers(query);
  }

  @Patch("users/:id/status")
  updateUserStatus(@Param("id") id: string, @Body() dto: UpdateAdminStatusDto) {
    return this.adminService.updateUserStatus(id, dto.status);
  }

  @Patch("users/:id")
  updateUser(@Param("id") id: string, @Body() dto: UpdateAdminUserDto) {
    return this.adminService.updateUser(id, dto);
  }

  @Delete("users/:id")
  removeUser(@Param("id") id: string, @CurrentUser() user: { sub: string }) {
    return this.adminService.removeUser(id, user.sub);
  }

  @Get("terrains")
  terrains(@Query() query: ListAdminResourcesDto) {
    return this.adminService.listTerrains(query);
  }

  @Patch("terrains/:id/status")
  updateTerrainStatus(
    @Param("id") id: string,
    @CurrentUser() user: { sub: string },
    @Body() dto: UpdateAdminStatusDto
  ) {
    return this.adminService.updateTerrainStatus(id, user.sub, dto.status);
  }

  @Patch("terrains/:id")
  updateTerrain(@Param("id") id: string, @Body() dto: UpdateTerrainDto) {
    return this.adminService.updateTerrain(id, dto);
  }

  @Delete("terrains/:id")
  removeTerrain(@Param("id") id: string, @CurrentUser() user: { sub: string }) {
    return this.adminService.removeTerrain(id, user.sub);
  }

  @Post("terrains/:id/images")
  addTerrainImage(@Param("id") id: string, @Body() dto: CreateTerrainImageDto) {
    return this.adminService.addTerrainImage(id, dto);
  }

  @Delete("terrain-images/:id")
  removeTerrainImage(@Param("id") id: string) {
    return this.adminService.removeTerrainImage(id);
  }

  @Get("projects")
  projects(@Query() query: ListAdminResourcesDto) {
    return this.adminService.listProjects(query);
  }

  @Patch("projects/:id/status")
  updateProjectStatus(@Param("id") id: string, @Body() dto: UpdateAdminStatusDto) {
    return this.adminService.updateProjectStatus(id, dto.status);
  }

  @Patch("projects/:id")
  updateProject(@Param("id") id: string, @Body() dto: UpdateProjectDto) {
    return this.adminService.updateProject(id, dto);
  }

  @Delete("projects/:id")
  removeProject(@Param("id") id: string) {
    return this.adminService.removeProject(id);
  }

  @Post("projects/:id/images")
  addProjectImage(@Param("id") id: string, @Body() dto: CreateProjectImageDto) {
    return this.adminService.addProjectImage(id, dto);
  }

  @Delete("project-images/:id")
  removeProjectImage(@Param("id") id: string) {
    return this.adminService.removeProjectImage(id);
  }

  @Get("simulations")
  simulations(@Query() query: ListAdminResourcesDto) {
    return this.adminService.listSimulations(query);
  }

  @Patch("simulations/:id/status")
  updateSimulationStatus(@Param("id") id: string, @Body() dto: UpdateAdminStatusDto) {
    return this.adminService.updateSimulationStatus(id, dto.status);
  }

  @Delete("simulations/:id")
  removeSimulation(@Param("id") id: string) {
    return this.adminService.removeSimulation(id);
  }

  @Get("orders")
  orders(@Query() query: ListAdminResourcesDto) {
    return this.adminService.listOrders(query);
  }

  @Patch("orders/:id/status")
  updateOrderStatus(@Param("id") id: string, @Body() dto: UpdateAdminStatusDto) {
    return this.adminService.updateOrderStatus(id, dto.status);
  }

  @Get("events")
  events(@Query() query: ListAdminResourcesDto) {
    return this.adminService.listEvents(query);
  }

  @Patch("architects/:id/approve")
  approveArchitect(@Param("id") id: string, @CurrentUser() user: { sub: string }) {
    return this.adminService.approveArchitect(id, user.sub);
  }

  @Patch("architects/:id")
  updateArchitect(
    @Param("id") id: string,
    @CurrentUser() user: { sub: string },
    @Body() dto: UpdateAdminArchitectDto
  ) {
    return this.adminService.updateArchitect(id, user.sub, dto);
  }

  @Delete("architects/:id")
  removeArchitect(@Param("id") id: string) {
    return this.adminService.removeArchitect(id);
  }

  @Patch("architects/:id/reject")
  rejectArchitect(
    @Param("id") id: string,
    @CurrentUser() user: { sub: string },
    @Body() dto: RejectArchitectDto
  ) {
    return this.adminService.rejectArchitect(id, user.sub, dto);
  }

  @Patch("terrains/:id/approve")
  approveTerrain(@Param("id") id: string, @CurrentUser() user: { sub: string }) {
    return this.adminService.approveTerrain(id, user.sub);
  }

  @Patch("terrains/:id/archive")
  archiveTerrain(@Param("id") id: string, @CurrentUser() user: { sub: string }) {
    return this.adminService.archiveTerrain(id, user.sub);
  }
}
