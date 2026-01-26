<?php
require_once('../../config/conexion.php');
if (isset($_SESSION["usu_id"])) {
?>
    <!DOCTYPE html>
    <html>
    <?php require_once('../MainHead/head.php') ?>
    <title>Gestion de pasos</title>
    <style>
        /* Estilos para el Timeline de Rutas */
        .timeline-steps {
            position: relative;
            padding: 20px 0;
            list-style: none;
        }

        .timeline-steps:before {
            content: '';
            position: absolute;
            top: 0;
            bottom: 0;
            left: 20px;
            width: 2px;
            background: #e6e6e6;
        }

        .timeline-step-item {
            position: relative;
            padding-left: 50px;
            margin-bottom: 20px;
        }

        .timeline-step-marker {
            position: absolute;
            left: 10px;
            top: 0;
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: #00a8ff;
            border: 2px solid #fff;
            box-shadow: 0 0 0 2px #00a8ff;
            text-align: center;
            line-height: 18px;
            color: #fff;
            font-weight: bold;
            font-size: 12px;
        }

        .timeline-step-content {
            background: #f9f9f9;
            padding: 15px;
            border-radius: 4px;
            border: 1px solid #e6e6e6;
        }

        .timeline-step-title {
            font-weight: bold;
            margin-bottom: 5px;
            color: #333;
        }

        /* Estilos para Tarjetas de Transición */
        .transition-card {
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            margin-bottom: 15px;
            transition: all 0.3s ease;
        }

        .transition-card:hover {
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
            border-color: #00a8ff;
        }

        .transition-card-header {
            background: #f5f5f5;
            padding: 10px 15px;
            border-bottom: 1px solid #e0e0e0;
            border-radius: 8px 8px 0 0;
            font-weight: bold;
        }

        .transition-card-body {
            padding: 15px;
        }

        /* Mejoras generales */
        .modal-header-primary {
            background-color: #00a8ff;
            color: white;
        }

        .modal-header-primary .close {
            color: white;
            opacity: 0.8;
        }

        .modal-header-primary .close:hover {
            opacity: 1;
        }
    </style>
    </head>

    <body class="with-side-menu">

        <?php require_once('../MainHeader/header.php') ?>

        <div class="mobile-menu-left-overlay"></div>

        <?php require_once('../MainNav/nav.php') ?>

        <!-- contenido -->
        <div class="page-content">
            <div class="container-fluid">
                <header class="section-header">
                    <div class="tbl">
                        <div class="tbl-row">
                            <div class="tbl-cell">
                                <h3>Gestion de pasos</h3>
                                <ol class="breadcrumb breadcrumb-simple">
                                    <li><a href="..\Home\">Home</a></li>
                                    <li><a href="#">Gestion</a></li>
                                    <li><a href="..\GestionFlujo\">Gestion de flujo</a></li>
                                    <li class="active">Gestion de pasos</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </header>
                <div class="box-typical box-typical-padding">
                    <button type="button" id="btn_cargue_masivo" class="btn btn-inline btn-success" data-toggle="modal" data-target="#modalCargueMasivo">
                        <i class="fa fa-upload"></i> Cargue Masivo
                    </button>
                    <button type="button" id="btnnuevopaso" class="btn btn-inline btn-primary">Nuevo paso</button>
                    <table id="paso_data" class="table table-bordered table-striped table-vcenter js-dataTable-full">
                        <thead>
                            <tr role="row">
                                <th style="width: 20%;">Paso</th>
                                <th style="width: 20%;">Nombre</th>
                                <th style="width: 20%;">Usuario asigando</th>
                                <th style="width: 10%;">Seleccion manual</th>
                                <th style="width: 10%;">Es tarea nacional</th>
                                <th style="width: 10%;">Es Aprobación</th>
                                <th class="text-center" style="width: 5%;">Transiciones</th>
                                <th class="text-center" style="width: 2%;">Editar</th>
                                <th class="text-center" style="width: 2%;">Eliminar</th>
                            </tr>
                        </thead>
                    </table>
                </div>
            </div>
        </div>

        <!-- Modal para Gestionar Transiciones -->
        <div class="modal fade" id="modalGestionTransiciones" tabindex="-1" role="dialog" aria-labelledby="modalGestionTransicionesLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg" role="document">
                <div class="modal-content">

                    <div class="modal-header modal-header-primary">
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                        <h5 class="modal-title" id="modalGestionTransicionesLabel">
                            <i class="fa fa-sitemap"></i> Gestionar Transiciones
                        </h5>
                    </div>

                    <div class="modal-body">
                        <div class="alert alert-light border mb-4" role="alert">
                            <i class="fa fa-info-circle text-primary"></i> Configurando transiciones para el paso: <strong id="nombre_paso_origen" class="text-primary"></strong>
                        </div>

                        <div class="row">
                            <div class="col-lg-5">
                                <div class="card transition-card">
                                    <div class="transition-card-header text-primary">
                                        <i class="fa fa-plus-circle"></i> Añadir Nueva Transición
                                    </div>
                                    <div class="transition-card-body">
                                        <form id="transicion_form" method="post">
                                            <input type="hidden" id="paso_origen_id_modal" name="paso_origen_id_modal">

                                            <div class="form-group">
                                                <label class="font-weight-bold">Tipo de Destino</label>
                                                <div class="btn-group btn-group-toggle d-flex" data-toggle="buttons">
                                                    <label class="btn btn-outline-primary active w-50">
                                                        <input type="radio" name="tipo_destino" id="tipo_destino_ruta" value="ruta" checked> <i class="fa fa-random"></i> Ruta
                                                    </label>
                                                    <label class="btn btn-outline-primary w-50">
                                                        <input type="radio" name="tipo_destino" id="tipo_destino_paso" value="paso"> <i class="fa fa-step-forward"></i> Paso Directo
                                                    </label>
                                                </div>
                                            </div>

                                            <div id="container_ruta_destino">
                                                <div class="form-group">
                                                    <label for="ruta_id_modal" class="font-weight-bold">1. Seleccione Ruta</label>
                                                    <div class="input-group">
                                                        <select id="ruta_id_modal" name="ruta_id_modal" class="form-control selectpicker" data-live-search="true" title="Seleccionar..."></select>
                                                        <div class="input-group-append">
                                                            <button class="btn btn-success" type="button" id="btnNuevaRuta" title="Crear Nueva Ruta"><i class="fa fa-plus"></i></button>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="text-right mb-2">
                                                    <button class="btn btn-sm btn-info" type="button" id="btnGestionarPasos" title="Ver/Editar Pasos"><i class="fa fa-cogs"></i> Gestionar Pasos de Ruta</button>
                                                </div>
                                            </div>

                                            <div class="form-group" id="container_paso_destino" style="display: none;">
                                                <label for="paso_destino_id_modal" class="font-weight-bold">1. Seleccione Paso</label>
                                                <select id="paso_destino_id_modal" name="paso_destino_id_modal" class="form-control selectpicker" data-live-search="true" title="Seleccionar..."></select>
                                            </div>

                                            <div class="form-group">
                                                <label for="condicion_nombre_modal" class="font-weight-bold">2. Nombre de la Decisión</label>
                                                <input type="text" id="condicion_nombre_modal" name="condicion_nombre_modal" class="form-control" placeholder="Ej: Aprobar" required>
                                            </div>

                                            <div class="form-group">
                                                <label for="condicion_clave_modal">Clave (Opcional)</label>
                                                <input type="text" id="condicion_clave_modal" name="condicion_clave_modal" class="form-control" placeholder="Ej: APROBADO">
                                            </div>

                                            <!-- Area Nueva Ruta (Oculta por defecto) -->
                                            <div id="areaNuevaRuta" class="p-3 mb-3 bg-light border rounded" style="display: none;">
                                                <label class="font-weight-bold text-success">Nueva Ruta</label>
                                                <div class="input-group">
                                                    <input type="text" id="nueva_ruta_nombre" class="form-control" placeholder="Nombre de la ruta">
                                                    <div class="input-group-append">
                                                        <button class="btn btn-success" type="button" id="btnGuardarRuta"><i class="fa fa-check"></i></button>
                                                        <button class="btn btn-secondary" type="button" id="btnCancelarNuevaRuta"><i class="fa fa-times"></i></button>
                                                    </div>
                                                </div>
                                            </div>

                                            <button type="submit" name="action" value="add" class="btn btn-primary btn-block"><i class="fa fa-plus"></i> Añadir Transición</button>
                                        </form>
                                    </div>
                                </div>
                            </div>

                            <div class="col-lg-7">
                                <h5 class="mb-3 text-secondary">Transiciones Existentes</h5>
                                <div class="table-responsive">
                                    <table id="transiciones_data" class="table table-hover table-bordered bg-white">
                                        <thead class="thead-light">
                                            <tr>
                                                <th>Destino</th>
                                                <th>Decisión</th>
                                                <th>Clave</th>
                                                <th class="text-center">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Cerrar</button>
                    </div>
                </div>
            </div>
        </div>

        <div class="modal fade" id="modalGestionPasosRuta" tabindex="-1" role="dialog" aria-labelledby="modalGestionPasosRutaLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg" role="document">
                <div class="modal-content">
                    <div class="modal-header modal-header-primary">
                        <h5 class="modal-title" id="modalGestionPasosRutaLabel"><i class="fa fa-map-signs"></i> Gestionar Pasos de la Ruta</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <input type="hidden" id="gestion_ruta_id" name="gestion_ruta_id">

                        <div class="alert alert-info border mb-4" role="alert">
                            <i class="fa fa-info-circle"></i> Estás añadiendo pasos a la ruta: <strong id="gestion_ruta_nombre"></strong>
                        </div>

                        <div class="row">
                            <div class="col-lg-4">
                                <div class="card">
                                    <div class="card-header bg-light">
                                        <strong>Añadir Paso</strong>
                                    </div>
                                    <div class="card-body">
                                        <form id="rutapaso_form">
                                            <div class="form-group">
                                                <label for="paso_id_para_ruta" class="font-weight-bold">Paso a añadir</label>
                                                <select id="paso_id_para_ruta" name="paso_id_para_ruta" class="form-control" required></select>
                                            </div>
                                            <div class="form-group">
                                                <label for="orden_del_paso" class="font-weight-bold">Orden</label>
                                                <input type="number" id="orden_del_paso" name="orden_del_paso" class="form-control" required min="1" placeholder="Ej: 1">
                                            </div>
                                            <button type="submit" class="btn btn-primary btn-block"><i class="fa fa-plus"></i> Añadir a la Ruta</button>
                                        </form>
                                    </div>
                                </div>
                            </div>

                            <div class="col-lg-8">
                                <h5 class="mb-3 text-secondary">Secuencia de Pasos</h5>
                                <div id="rutapasos_timeline_container" style="max-height: 400px; overflow-y: auto;">
                                    <!-- Aquí se renderizará el timeline o la tabla -->
                                    <table id="rutapasos_data" class="table table-bordered table-striped mt-2">
                                        <thead>
                                            <tr>
                                                <th style="width: 15%;">Orden</th>
                                                <th>Nombre del Paso</th>
                                                <th style="width: 10%;"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Cerrar</button>
                    </div>
                </div>
            </div>
        </div>

        <?php require_once('../PasoFlujo/modalnuevopaso.php') ?>
        <?php require_once('../MainJs/js.php') ?>

        <script src="../../public/js/pdf.min.js"></script>
        <script>
            // Set worker source
            pdfjsLib.GlobalWorkerOptions.workerSrc = '../../public/js/pdf.worker.min.js';
        </script>

        <script type="text/javascript" src="../PasoFlujo/pasoflujo.js"></script>
        <script type="text/javascript" src="../notificacion.js"></script>


    </body>

    </html>
<?php
} else {
    $conectar = new Conectar();
    header("Location: " . $conectar->ruta() . "index.php");
}
?>